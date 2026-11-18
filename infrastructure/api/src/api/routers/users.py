from fastapi import APIRouter, Depends, status
from api.dependencies import (
    get_current_user,
    get_user_repository,
    get_account_repository,
    get_password_hasher,
)
from api.schemas.user import UserCreateRequest, UserResponse, UserUpdateRequest
from database.repository import AsyncpgUserRepository, AsyncpgAccountRepository
from user.application.dtos import CreateUserInput, UpdateUserInput
from user.application.security import PasswordHasher
from user.application.use_cases import CreateUserUseCase, ListUsersUseCase, UpdateUserUseCase
from user.domain.entities import User
from account.application.dtos import CreateAccountInput
from account.application.use_cases import CreateAccountUseCase

router = APIRouter(prefix="/user", tags=["Users"])


@router.get("", response_model=list[UserResponse])
async def list_users(
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
) -> list[UserResponse]:
    use_case = ListUsersUseCase(user_repo)
    users = await use_case.execute()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            username=u.username,
        )
        for u in users
    ]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
    account_repo: AsyncpgAccountRepository = Depends(get_account_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
) -> UserResponse:
    use_case = CreateUserUseCase(user_repo, password_hasher)
    user_output = await use_case.execute(
        CreateUserInput(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            name=payload.name or payload.username,
        )
    )

    # Automatically provision a default checking account for the new user
    account_use_case = CreateAccountUseCase(account_repo)
    await account_use_case.execute(
        CreateAccountInput(
            user_id=user_output.id,
            initial_balance=1000.0,
        )
    )

    return UserResponse(
        id=user_output.id,
        name=user_output.name,
        email=user_output.email,
        username=user_output.username,
    )


@router.get("/me", response_model=UserResponse, summary="Dados do usuário autenticado")
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        username=current_user.username,
    )


@router.put("/me", response_model=UserResponse, summary="Atualiza nome, e-mail e/ou senha do usuário autenticado")
async def update_me(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
) -> UserResponse:
    use_case = UpdateUserUseCase(user_repo, password_hasher)
    updated = await use_case.execute(
        UpdateUserInput(
            user_id=current_user.id,
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
    )
    return UserResponse(
        id=updated.id,
        name=updated.name,
        email=updated.email,
        username=updated.username,
    )
