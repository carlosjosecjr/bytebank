from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, OAuth2PasswordBearer
import asyncpg
import jwt

from database.connection.session import get_connection
from database.repository import (
    AsyncpgUserRepository,
    AsyncpgAccountRepository,
    AsyncpgTransactionRepository,
    AsyncpgAccountBalanceService,
)
from user.domain.entities import User
from user.application.security import BcryptPasswordHasher
from api.services.token_service import JwtTokenService
from api.settings import get_settings

# OAuth2 "password" flow: no /docs, o botão Authorize faz POST (form) em /user/auth,
# recebe o access_token e passa a enviar "Authorization: Bearer <token>".
# Fora do Swagger, basta enviar o mesmo header Bearer.
# auto_error=False: sem header, o token ainda pode vir do cookie httpOnly (front-end).
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/user/auth",
    description="Informe usuário/e-mail e senha: o token é gerado em /user/auth e enviado como Bearer",
    auto_error=False,
)
http_basic = HTTPBasic(
    description="Autenticação básica HTTP com usuário/email e senha para gerar o token",
    auto_error=False,
)


async def get_db() -> AsyncGenerator[asyncpg.Connection, None]:
    async for conn in get_connection():
        yield conn


def get_password_hasher() -> BcryptPasswordHasher:
    return BcryptPasswordHasher()


def get_token_service() -> JwtTokenService:
    return JwtTokenService()


def get_user_repository(
    conn: asyncpg.Connection = Depends(get_db),
) -> AsyncpgUserRepository:
    return AsyncpgUserRepository(conn)


def get_account_repository(
    conn: asyncpg.Connection = Depends(get_db),
) -> AsyncpgAccountRepository:
    return AsyncpgAccountRepository(conn)


def get_transaction_repository(
    conn: asyncpg.Connection = Depends(get_db),
) -> AsyncpgTransactionRepository:
    return AsyncpgTransactionRepository(conn)


def get_account_balance_service(
    conn: asyncpg.Connection = Depends(get_db),
) -> AsyncpgAccountBalanceService:
    return AsyncpgAccountBalanceService(conn)


async def get_current_user(
    request: Request,
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    token_service: JwtTokenService = Depends(get_token_service),
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
) -> User:
    # Header Bearer tem precedência; o cookie httpOnly é o caminho do front-end.
    token = bearer_token or request.cookies.get(get_settings().AUTH_COOKIE_NAME)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = token_service.decode_token(token)
        # O ID do usuário é transportado dentro do token (sub / id / user_id)
        user_id: str | None = payload.get("sub") or payload.get("id") or payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: user ID missing from token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
