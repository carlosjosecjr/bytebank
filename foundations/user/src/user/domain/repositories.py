from typing import Protocol, Optional
from user.domain.entities import User


class UserRepository(Protocol):
    async def create(self, user: User) -> User:
        ...

    async def get_by_id(self, user_id: str) -> Optional[User]:
        ...

    async def get_by_email(self, email: str) -> Optional[User]:
        ...

    async def get_by_username(self, username: str) -> Optional[User]:
        ...

    async def list_all(self) -> list[User]:
        ...

    async def update(self, user: User) -> User:
        ...
