from user.domain.entities import User
from user.domain.exceptions import UserAlreadyExistsError
from user.domain.repositories import UserRepository
from user.application.dtos import CreateUserInput, UserOutput
from user.application.security import PasswordHasher


class CreateUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
    ) -> None:
        self.user_repository = user_repository
        self.password_hasher = password_hasher

    async def execute(self, input_dto: CreateUserInput) -> UserOutput:
        existing_email = await self.user_repository.get_by_email(input_dto.email)
        if existing_email:
            raise UserAlreadyExistsError("A user with this email already exists")

        existing_username = await self.user_repository.get_by_username(input_dto.username)
        if existing_username:
            raise UserAlreadyExistsError("A user with this username already exists")

        password_hash = self.password_hasher.hash(input_dto.password)

        user = User(
            username=input_dto.username,
            email=input_dto.email,
            password_hash=password_hash,
            name=input_dto.name or input_dto.username,
        )

        saved = await self.user_repository.create(user)

        return UserOutput(
            id=saved.id,
            name=saved.name,
            email=saved.email,
            username=saved.username,
            created_at=saved.created_at,
        )
