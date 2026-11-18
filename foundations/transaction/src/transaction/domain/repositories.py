from typing import Protocol, Optional
from transaction.domain.entities import Transaction


class TransactionRepository(Protocol):
    async def create(self, transaction: Transaction) -> Transaction:
        ...

    async def get_by_id(self, transaction_id: str) -> Optional[Transaction]:
        ...

    async def list_by_account_id(self, account_id: str) -> list[Transaction]:
        ...

    async def update(self, transaction: Transaction) -> Transaction:
        ...

    async def delete(self, transaction_id: str) -> bool:
        ...
