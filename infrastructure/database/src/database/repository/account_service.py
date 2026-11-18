from typing import Optional
import asyncpg
from account.domain.exceptions import AccountNotFoundError, UnauthorizedAccountError, InsufficientBalanceError
from account.domain.entities import Account
from transaction.application.protocols import AccountBalanceService
from database.sqlc.querier import Querier


class AsyncpgAccountBalanceService(AccountBalanceService):
    def __init__(self, conn: asyncpg.Connection) -> None:
        self.conn = conn
        self.querier = Querier(conn)

    async def _get_account_entity(self, account_id: str, user_id: Optional[str] = None) -> Account:
        row = await self.querier.get_account_by_id(account_id)
        if not row:
            raise AccountNotFoundError(f"Account with ID {account_id} not found")

        if user_id is not None and row.user_id != user_id:
            raise UnauthorizedAccountError("You do not have permission to operate on this account")

        return Account(
            id=row.id,
            user_id=row.user_id,
            account_number=row.account_number,
            balance=row.balance,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def apply_balance_change(
        self,
        account_id: str,
        amount: float,
        transaction_type: str,
        user_id: Optional[str] = None,
    ) -> None:
        account = await self._get_account_entity(account_id, user_id)

        type_lower = transaction_type.strip().lower()
        if type_lower == "debit":
            account.debit(amount)
        elif type_lower == "credit":
            account.credit(amount)
        else:
            raise ValueError(f"Invalid transaction type: {transaction_type}")

        await self.querier.update_account_balance(
            id=account.id,
            balance=account.balance,
            updated_at=account.updated_at,
        )

    async def revert_balance_change(
        self,
        account_id: str,
        amount: float,
        transaction_type: str,
        user_id: Optional[str] = None,
    ) -> None:
        account = await self._get_account_entity(account_id, user_id)

        type_lower = transaction_type.strip().lower()
        if type_lower == "debit":
            # Reverting debit -> restore money
            account.credit(amount)
        elif type_lower == "credit":
            # Reverting credit -> withdraw money
            account.debit(amount)
        else:
            raise ValueError(f"Invalid transaction type: {transaction_type}")

        await self.querier.update_account_balance(
            id=account.id,
            balance=account.balance,
            updated_at=account.updated_at,
        )
