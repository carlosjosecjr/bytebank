from typing import Optional
from transaction.domain.exceptions import TransactionNotFoundError
from transaction.domain.repositories import TransactionRepository
from transaction.application.protocols import AccountBalanceService


class DeleteTransactionUseCase:
    def __init__(
        self,
        transaction_repository: TransactionRepository,
        account_service: AccountBalanceService,
    ) -> None:
        self.transaction_repository = transaction_repository
        self.account_service = account_service

    async def execute(self, transaction_id: str, user_id: Optional[str] = None) -> bool:
        transaction = await self.transaction_repository.get_by_id(transaction_id)
        if not transaction:
            raise TransactionNotFoundError(f"Transaction with ID {transaction_id} not found")

        # Revert balance change in account
        await self.account_service.revert_balance_change(
            account_id=transaction.account_id,
            amount=transaction.value,
            transaction_type=transaction.type.value,
            user_id=user_id,
        )

        return await self.transaction_repository.delete(transaction_id)
