from typing import Optional
from transaction.domain.repositories import TransactionRepository
from transaction.application.dtos import TransactionOutput


class GetTransactionByIdUseCase:
    def __init__(self, transaction_repository: TransactionRepository) -> None:
        self.transaction_repository = transaction_repository

    async def execute(self, transaction_id: str) -> Optional[TransactionOutput]:
        tx = await self.transaction_repository.get_by_id(transaction_id)
        if not tx:
            return None
        return TransactionOutput(
            id=tx.id,
            account_id=tx.account_id,
            value=tx.value,
            type=tx.type.value,
            from_party=tx.from_party,
            to_party=tx.to_party,
            anexo=tx.anexo,
            url_anexo=tx.url_anexo,
            created_at=tx.created_at,
        )
