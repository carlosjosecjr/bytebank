from typing import Optional
import asyncpg
from account.domain.entities import Account
from account.domain.repositories import AccountRepository
from database.sqlc.querier import Querier
from database.sqlc.models import AccountRow


class AsyncpgAccountRepository(AccountRepository):
    def __init__(self, conn: asyncpg.Connection) -> None:
        self.conn = conn
        self.querier = Querier(conn)

    def _to_entity(self, row: AccountRow) -> Account:
        return Account(
            id=row.id,
            user_id=row.user_id,
            account_number=row.account_number,
            balance=row.balance,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    async def create(self, account: Account) -> Account:
        row = await self.querier.create_account(
            id=account.id,
            user_id=account.user_id,
            account_number=account.account_number,
            balance=account.balance,
            created_at=account.created_at,
            updated_at=account.updated_at,
        )
        return self._to_entity(row)

    async def get_by_id(self, account_id: str) -> Optional[Account]:
        row = await self.querier.get_account_by_id(account_id)
        return self._to_entity(row) if row else None

    async def get_by_number(self, account_number: str) -> Optional[Account]:
        row = await self.querier.get_account_by_number(account_number)
        return self._to_entity(row) if row else None

    async def list_by_user_id(self, user_id: str) -> list[Account]:
        rows = await self.querier.list_accounts_by_user_id(user_id)
        return [self._to_entity(r) for r in rows]

    async def update(self, account: Account) -> Account:
        row = await self.querier.update_account_balance(
            id=account.id,
            balance=account.balance,
            updated_at=account.updated_at,
        )
        return self._to_entity(row) if row else account
