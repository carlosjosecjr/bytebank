from typing import Protocol, Optional
from account.domain.entities import Account


class AccountRepository(Protocol):
    async def create(self, account: Account) -> Account:
        ...

    async def get_by_id(self, account_id: str) -> Optional[Account]:
        ...

    async def get_by_number(self, account_number: str) -> Optional[Account]:
        ...

    async def list_by_user_id(self, user_id: str) -> list[Account]:
        ...

    async def update(self, account: Account) -> Account:
        ...
