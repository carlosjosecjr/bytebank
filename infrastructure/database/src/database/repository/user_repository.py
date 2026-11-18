from typing import Optional
import asyncpg
from user.domain.entities import User
from user.domain.exceptions import UserNotFoundError
from user.domain.repositories import UserRepository
from database.sqlc.querier import Querier
from database.sqlc.models import UserRow


class AsyncpgUserRepository(UserRepository):
    def __init__(self, conn: asyncpg.Connection) -> None:
        self.conn = conn
        self.querier = Querier(conn)

    def _to_entity(self, row: UserRow) -> User:
        return User(
            id=row.id,
            username=row.username,
            name=row.name,
            email=row.email,
            password_hash=row.password_hash,
            created_at=row.created_at,
        )

    async def create(self, user: User) -> User:
        row = await self.querier.create_user(
            id=user.id,
            username=user.username,
            name=user.name,
            email=user.email,
            password_hash=user.password_hash,
            created_at=user.created_at,
        )
        return self._to_entity(row)

    async def get_by_id(self, user_id: str) -> Optional[User]:
        row = await self.querier.get_user_by_id(user_id)
        return self._to_entity(row) if row else None

    async def get_by_email(self, email: str) -> Optional[User]:
        row = await self.querier.get_user_by_email(email)
        return self._to_entity(row) if row else None

    async def get_by_username(self, username: str) -> Optional[User]:
        row = await self.querier.get_user_by_username(username)
        return self._to_entity(row) if row else None

    async def list_all(self) -> list[User]:
        rows = await self.querier.list_users()
        return [self._to_entity(r) for r in rows]

    async def update(self, user: User) -> User:
        row = await self.querier.update_user(
            id=user.id,
            name=user.name,
            email=user.email,
            password_hash=user.password_hash,
        )
        if row is None:
            raise UserNotFoundError("User not found")
        return self._to_entity(row)
