from typing import Optional
from transaction.domain.entities import TransactionType
from transaction.domain.exceptions import TransactionNotFoundError
from transaction.domain.repositories import TransactionRepository
from transaction.application.dtos import UpdateTransactionInput, TransactionOutput
from transaction.application.protocols import AccountBalanceService


class UpdateTransactionUseCase:
    def __init__(
        self,
        transaction_repository: TransactionRepository,
        account_service: AccountBalanceService,
    ) -> None:
        self.transaction_repository = transaction_repository
        self.account_service = account_service

    async def execute(self, input_dto: UpdateTransactionInput) -> TransactionOutput:
        transaction = await self.transaction_repository.get_by_id(input_dto.transaction_id)
        if not transaction:
            raise TransactionNotFoundError(f"Transaction with ID {input_dto.transaction_id} not found")

        # Determine if value or type changed
        new_type = TransactionType.from_str(input_dto.type) if input_dto.type else transaction.type
        new_value = input_dto.value if input_dto.value is not None else transaction.value

        balance_impact_changed = (new_type != transaction.type) or (new_value != transaction.value)

        if balance_impact_changed:
            # Revert old impact
            await self.account_service.revert_balance_change(
                account_id=transaction.account_id,
                amount=transaction.value,
                transaction_type=transaction.type.value,
                user_id=input_dto.user_id,
            )
            try:
                # Apply new impact
                await self.account_service.apply_balance_change(
                    account_id=transaction.account_id,
                    amount=new_value,
                    transaction_type=new_type.value,
                    user_id=input_dto.user_id,
                )
            except Exception:
                # Restore old impact if new fails
                await self.account_service.apply_balance_change(
                    account_id=transaction.account_id,
                    amount=transaction.value,
                    transaction_type=transaction.type.value,
                    user_id=input_dto.user_id,
                )
                raise

            transaction.value = new_value
            transaction.type = new_type

        if input_dto.from_party is not None:
            transaction.from_party = input_dto.from_party
        if input_dto.to_party is not None:
            transaction.to_party = input_dto.to_party
        if input_dto.anexo is not None:
            transaction.anexo = input_dto.anexo
        if input_dto.url_anexo is not None:
            transaction.url_anexo = input_dto.url_anexo

        updated = await self.transaction_repository.update(transaction)

        return TransactionOutput(
            id=updated.id,
            account_id=updated.account_id,
            value=updated.value,
            type=updated.type.value,
            from_party=updated.from_party,
            to_party=updated.to_party,
            anexo=updated.anexo,
            url_anexo=updated.url_anexo,
            created_at=updated.created_at,
        )
