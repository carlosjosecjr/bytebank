from user.domain.repositories import UserRepository
from user.application.dtos import UserOutput


class ListUsersUseCase:
    def __init__(self, user_repository: UserRepository) -> None:
        self.user_repository = user_repository

    async def execute(self) -> list[UserOutput]:
        users = await self.user_repository.list_all()
        return [
            UserOutput(
                id=u.id,
                name=u.name,
                email=u.email,
                username=u.username,
                created_at=u.created_at,
            )
            for u in users
        ]
