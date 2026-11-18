from account.domain.repositories import AccountRepository
from account.application.dtos import AccountOutput


class ListAccountsUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    async def execute(self, user_id: str) -> list[AccountOutput]:
        accounts = await self.account_repository.list_by_user_id(user_id)
        return [
            AccountOutput(
                id=acc.id,
                user_id=acc.user_id,
                account_number=acc.account_number,
                balance=acc.balance,
                created_at=acc.created_at,
            )
            for acc in accounts
        ]
