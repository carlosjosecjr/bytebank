import random
from account.domain.entities import Account
from account.domain.repositories import AccountRepository
from account.application.dtos import CreateAccountInput, AccountOutput


class CreateAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    async def execute(self, input_dto: CreateAccountInput) -> AccountOutput:
        account_number = input_dto.account_number
        if not account_number:
            # Generate a 6-digit unique account number
            while True:
                candidate = str(random.randint(100000, 999999))
                existing = await self.account_repository.get_by_number(candidate)
                if not existing:
                    account_number = candidate
                    break

        account = Account(
            user_id=input_dto.user_id,
            account_number=account_number,
            balance=max(0.0, float(input_dto.initial_balance)),
        )

        saved = await self.account_repository.create(account)
        return AccountOutput(
            id=saved.id,
            user_id=saved.user_id,
            account_number=saved.account_number,
            balance=saved.balance,
            created_at=saved.created_at,
        )
