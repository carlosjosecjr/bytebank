from typing import Optional
from transaction.domain.entities import Transaction, TransactionType
from transaction.domain.repositories import TransactionRepository
from transaction.application.dtos import CreateTransactionInput, TransactionOutput
from transaction.application.protocols import AccountBalanceService


class CreateTransactionUseCase:
    def __init__(
        self,
        transaction_repository: TransactionRepository,
        account_service: AccountBalanceService,
    ) -> None:
        self.transaction_repository = transaction_repository
        self.account_service = account_service

    async def execute(self, input_dto: CreateTransactionInput) -> TransactionOutput:
        tx_type = TransactionType.from_str(input_dto.type)

        # Apply balance change to the account (checks balance, existence, and ownership)
        await self.account_service.apply_balance_change(
            account_id=input_dto.account_id,
            amount=input_dto.value,
            transaction_type=tx_type.value,
            user_id=input_dto.user_id,
        )

        transaction = Transaction(
            account_id=input_dto.account_id,
            value=input_dto.value,
            type=tx_type,
            from_party=input_dto.from_party,
            to_party=input_dto.to_party,
            anexo=input_dto.anexo,
            url_anexo=input_dto.url_anexo,
        )

        saved = await self.transaction_repository.create(transaction)

        return TransactionOutput(
            id=saved.id,
            account_id=saved.account_id,
            value=saved.value,
            type=saved.type.value,
            from_party=saved.from_party,
            to_party=saved.to_party,
            anexo=saved.anexo,
            url_anexo=saved.url_anexo,
            created_at=saved.created_at,
        )
