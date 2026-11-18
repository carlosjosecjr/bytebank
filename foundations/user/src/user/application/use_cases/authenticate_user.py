from typing import Protocol
from user.domain.exceptions import InvalidCredentialsError
from user.domain.repositories import UserRepository
from user.application.dtos import AuthInput, AuthOutput
from user.application.security import PasswordHasher


class TokenService(Protocol):
    def generate_token(self, user_id: str, email: str) -> str:
        ...


class AuthenticateUserUseCase:
    def __init__(
        self,
        user_repository: UserRepository,
        password_hasher: PasswordHasher,
        token_service: TokenService,
    ) -> None:
        self.user_repository = user_repository
        self.password_hasher = password_hasher
        self.token_service = token_service

    async def execute(self, input_dto: AuthInput) -> AuthOutput:
        user = await self.user_repository.get_by_email(input_dto.email)
        if not user:
            raise InvalidCredentialsError("Invalid email or password")

        if not self.password_hasher.verify(input_dto.password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")

        token = self.token_service.generate_token(user.id, user.email)
        return AuthOutput(token=token, token_type="bearer")
