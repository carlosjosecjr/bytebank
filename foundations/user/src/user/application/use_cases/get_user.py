from typing import Optional
from user.domain.repositories import UserRepository
from user.application.dtos import UserOutput


class GetUserByIdUseCase:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def execute(self, user_id: str) -> Optional[UserOutput]:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return None
        return UserOutput(
            id=user.id,
            name=user.name,
            email=user.email,
            username=user.username,
            created_at=user.created_at,
        )
