from typing import Optional
from account.domain.repositories import AccountRepository
from account.application.dtos import AccountOutput


class GetAccountByIdUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    async def execute(self, account_id: str) -> Optional[AccountOutput]:
        account = await self.account_repository.get_by_id(account_id)
        if not account:
            return None
        return AccountOutput(
            id=account.id,
            user_id=account.user_id,
            account_number=account.account_number,
            balance=account.balance,
            created_at=account.created_at,
        )
