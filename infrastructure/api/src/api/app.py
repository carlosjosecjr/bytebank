import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.connection.session import init_db, close_pool
from api.settings import get_settings
from api.routers import (
    users_router,
    auth_router,
    accounts_router,
    static_router,
)
from user.domain.exceptions import (
    UserNotFoundError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
)
from account.domain.exceptions import (
    AccountNotFoundError,
    UnauthorizedAccountError,
    InsufficientBalanceError,
)
from transaction.domain.exceptions import (
    TransactionNotFoundError,
    InvalidTransactionError,
    UnauthorizedTransactionError,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Ensure database tables exist on startup
    await init_db()
    yield
    # Gracefully close connection pool on shutdown
    await close_pool()


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    @app.exception_handler(UserNotFoundError)
    async def user_not_found_handler(request: Request, exc: UserNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})

    @app.exception_handler(UserAlreadyExistsError)
    async def user_already_exists_handler(request: Request, exc: UserAlreadyExistsError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": str(exc)})

    @app.exception_handler(InvalidCredentialsError)
    async def invalid_credentials_handler(request: Request, exc: InvalidCredentialsError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"detail": str(exc)})

    @app.exception_handler(AccountNotFoundError)
    async def account_not_found_handler(request: Request, exc: AccountNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})

    @app.exception_handler(UnauthorizedAccountError)
    async def unauthorized_account_handler(request: Request, exc: UnauthorizedAccountError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(InsufficientBalanceError)
    async def insufficient_balance_handler(request: Request, exc: InsufficientBalanceError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    @app.exception_handler(TransactionNotFoundError)
    async def transaction_not_found_handler(request: Request, exc: TransactionNotFoundError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": str(exc)})

    @app.exception_handler(InvalidTransactionError)
    async def invalid_transaction_handler(request: Request, exc: InvalidTransactionError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    @app.exception_handler(UnauthorizedTransactionError)
    async def unauthorized_transaction_handler(request: Request, exc: UnauthorizedTransactionError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": str(exc)})

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": str(exc)})

    # Routers
    app.include_router(static_router)
    app.include_router(users_router)
    app.include_router(auth_router)
    app.include_router(accounts_router)

    # Static files mounting if directory exists
    public_dir = os.path.abspath(settings.PUBLIC_DIR)
    if os.path.isdir(public_dir):
        app.mount("/public", StaticFiles(directory=public_dir), name="public")

    return app


app = create_app()
