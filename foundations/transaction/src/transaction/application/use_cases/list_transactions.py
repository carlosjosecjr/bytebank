from transaction.domain.repositories import TransactionRepository
from transaction.application.dtos import TransactionOutput


class ListTransactionsUseCase:
    def __init__(self, transaction_repository: TransactionRepository) -> None:
        self.transaction_repository = transaction_repository

    async def execute(self, account_id: str) -> list[TransactionOutput]:
        transactions = await self.transaction_repository.list_by_account_id(account_id)
        return [
            TransactionOutput(
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
            for tx in transactions
        ]
