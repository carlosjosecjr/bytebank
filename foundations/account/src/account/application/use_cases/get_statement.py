from typing import Optional
from account.domain.exceptions import AccountNotFoundError, UnauthorizedAccountError
from account.domain.repositories import AccountRepository
from account.application.dtos import AccountOutput, AccountStatementOutput
from account.application.protocols import StatementTransactionRepository


class GetAccountStatementUseCase:
    def __init__(
        self,
        account_repository: AccountRepository,
        transaction_repository: StatementTransactionRepository,
    ) -> None:
        self.account_repository = account_repository
        self.transaction_repository = transaction_repository

    async def execute(
        self,
        account_id: str,
        requesting_user_id: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> AccountStatementOutput:
        """Extrato da conta. Com `limit`, devolve só uma página (mais recentes primeiro) + o total."""
        if limit is not None and limit < 1:
            raise ValueError("limit must be greater than 0")
        if offset < 0:
            raise ValueError("offset must not be negative")

        account = await self.account_repository.get_by_id(account_id)
        if not account:
            raise AccountNotFoundError(f"Account with ID {account_id} not found")

        if requesting_user_id is not None and account.user_id != requesting_user_id:
            raise UnauthorizedAccountError("You do not have permission to view this account statement")

        if limit is None:
            transactions = await self.transaction_repository.list_by_account_id(account_id)
            total = len(transactions)
        else:
            transactions = await self.transaction_repository.list_page_by_account_id(account_id, limit, offset)
            total = await self.transaction_repository.count_by_account_id(account_id)

        account_output = AccountOutput(
            id=account.id,
            user_id=account.user_id,
            account_number=account.account_number,
            balance=account.balance,
            created_at=account.created_at,
        )

        return AccountStatementOutput(
            account=account_output,
            transactions=transactions,
            total=total,
            limit=limit,
            offset=offset if limit is not None else 0,
        )
