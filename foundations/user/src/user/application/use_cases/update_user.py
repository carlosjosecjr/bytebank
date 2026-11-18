from dataclasses import replace
from user.domain.exceptions import UserAlreadyExistsError, UserNotFoundError
from user.domain.repositories import UserRepository
from user.application.dtos import UpdateUserInput, UserOutput
from user.application.security import PasswordHasher


class UpdateUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
    ) -> None:
        self.user_repository = user_repository
        self.password_hasher = password_hasher

    async def execute(self, input_dto: UpdateUserInput) -> UserOutput:
        user = await self.user_repository.get_by_id(input_dto.user_id)
        if not user:
            raise UserNotFoundError("User not found")

        changes: dict[str, str] = {}

        if input_dto.name is not None and input_dto.name.strip():
            changes["name"] = input_dto.name.strip()

        if input_dto.email is not None and input_dto.email != user.email:
            other = await self.user_repository.get_by_email(input_dto.email)
            if other and other.id != user.id:
                raise UserAlreadyExistsError("A user with this email already exists")
            changes["email"] = input_dto.email

        if input_dto.password:
            changes["password_hash"] = self.password_hasher.hash(input_dto.password)

        saved = await self.user_repository.update(replace(user, **changes)) if changes else user

        return UserOutput(
            id=saved.id,
            name=saved.name,
            email=saved.email,
            username=saved.username,
            created_at=saved.created_at,
        )
