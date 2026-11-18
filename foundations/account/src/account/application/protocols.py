from typing import Protocol
from account.application.dtos import StatementTransactionItem


class StatementTransactionRepository(Protocol):
    async def list_by_account_id(self, account_id: str) -> list[StatementTransactionItem]:
        ...

    async def list_page_by_account_id(
        self, account_id: str, limit: int, offset: int
    ) -> list[StatementTransactionItem]:
        ...

    async def count_by_account_id(self, account_id: str) -> int:
        ...
