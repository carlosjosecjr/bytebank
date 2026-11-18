from typing import Optional
import asyncpg
from transaction.domain.entities import Transaction, TransactionType
from transaction.domain.repositories import TransactionRepository
from account.application.dtos import StatementTransactionItem
from database.sqlc.querier import Querier
from database.sqlc.models import TransactionRow


class AsyncpgTransactionRepository(TransactionRepository):
    def __init__(self, conn: asyncpg.Connection) -> None:
        self.conn = conn
        self.querier = Querier(conn)

    def _to_entity(self, row: TransactionRow) -> Transaction:
        return Transaction(
            id=row.id,
            account_id=row.account_id,
            value=row.value,
            type=TransactionType(row.type),
            from_party=row.from_party,
            to_party=row.to_party,
            anexo=row.anexo,
            url_anexo=row.url_anexo,
            created_at=row.created_at,
        )

    def _to_statement_item(self, row: TransactionRow) -> StatementTransactionItem:
        return StatementTransactionItem(
            id=row.id,
            account_id=row.account_id,
            value=row.value,
            type=row.type,
            from_party=row.from_party,
            to_party=row.to_party,
            anexo=row.anexo,
            url_anexo=row.url_anexo,
            created_at=row.created_at,
        )

    async def create(self, transaction: Transaction) -> Transaction:
        row = await self.querier.create_transaction(
            id=transaction.id,
            account_id=transaction.account_id,
            value=transaction.value,
            type=transaction.type.value,
            from_party=transaction.from_party,
            to_party=transaction.to_party,
            anexo=transaction.anexo,
            url_anexo=transaction.url_anexo,
            created_at=transaction.created_at,
        )
        return self._to_entity(row)

    async def get_by_id(self, transaction_id: str) -> Optional[Transaction]:
        row = await self.querier.get_transaction_by_id(transaction_id)
        return self._to_entity(row) if row else None

    async def list_by_account_id(self, account_id: str) -> list[Transaction]:
        rows = await self.querier.list_transactions_by_account_id(account_id)
        return [self._to_entity(r) for r in rows]

    async def list_statement_items_by_account_id(self, account_id: str) -> list[StatementTransactionItem]:
        rows = await self.querier.list_transactions_by_account_id(account_id)
        return [self._to_statement_item(r) for r in rows]

    async def list_page_by_account_id(
        self, account_id: str, limit: int, offset: int
    ) -> list[StatementTransactionItem]:
        rows = await self.querier.list_transactions_by_account_id_paged(account_id, limit, offset)
        return [self._to_statement_item(r) for r in rows]

    async def count_by_account_id(self, account_id: str) -> int:
        return await self.querier.count_transactions_by_account_id(account_id)

    async def update(self, transaction: Transaction) -> Transaction:
        row = await self.querier.update_transaction(
            id=transaction.id,
            value=transaction.value,
            type=transaction.type.value,
            from_party=transaction.from_party,
            to_party=transaction.to_party,
            anexo=transaction.anexo,
            url_anexo=transaction.url_anexo,
        )
        return self._to_entity(row) if row else transaction

    async def delete(self, transaction_id: str) -> bool:
        status = await self.querier.delete_transaction(transaction_id)
        # asyncpg returns status string like "DELETE 1" or "DELETE 0"
        return " 1" in status or status.endswith("1")
