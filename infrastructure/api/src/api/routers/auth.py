import base64
from typing import Optional
from fastapi import APIRouter, Depends, Request, Response, HTTPException, status
from fastapi.security import HTTPBasicCredentials
from api.dependencies import (
    http_basic,
    get_user_repository,
    get_password_hasher,
    get_token_service,
)
from api.schemas.user import TokenResponse
from api.settings import get_settings
from database.repository import AsyncpgUserRepository
from user.application.security import PasswordHasher
from user.application.use_cases import TokenService
from user.domain.exceptions import InvalidCredentialsError

router = APIRouter(prefix="/user", tags=["Auth"])


async def extract_credentials(
    request: Request,
    basic_creds: Optional[HTTPBasicCredentials] = None,
) -> tuple[str, str]:
    content_type = request.headers.get("content-type", "")
    is_form = "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type

    # 0. OAuth2 password flow (botão Authorize do /docs): o form tem precedência,
    # pois o Swagger pode mandar client_id/client_secret num header Basic junto.
    if is_form:
        form = await request.form()
        if form.get("grant_type") == "password" and form.get("username") and form.get("password"):
            return str(form["username"]).strip(), str(form["password"])

    # 1. Primary input: HTTP Basic Auth (via Depends(http_basic) or header)
    if basic_creds and basic_creds.username and basic_creds.password:
        return basic_creds.username.strip(), basic_creds.password

    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Basic "):
        try:
            encoded_creds = auth_header.split(" ", 1)[1].strip()
            decoded_creds = base64.b64decode(encoded_creds).decode("utf-8")
            username, password = decoded_creds.split(":", 1)
            return username.strip(), password
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Basic Auth header format",
                headers={"WWW-Authenticate": "Basic"},
            )

    # 2. Fallback: Form Data (application/x-www-form-urlencoded)
    if is_form:
        form = await request.form()
        username = form.get("username") or form.get("email")
        password = form.get("password")
        if username and password:
            return str(username).strip(), str(password)

    # 3. Fallback: JSON Body
    try:
        body = await request.json()
        if isinstance(body, dict):
            identifier = body.get("email") or body.get("username")
            password = body.get("password")
            if identifier and password:
                return str(identifier).strip(), str(password)
    except Exception:
        pass

    # If no credentials found, prompt for Basic Auth
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Basic Auth required. Provide username/email and password.",
        headers={"WWW-Authenticate": "Basic"},
    )


async def _authenticate_and_issue_token(
    identifier: str,
    password: str,
    user_repo: AsyncpgUserRepository,
    password_hasher: PasswordHasher,
    token_service: TokenService,
) -> TokenResponse:
    # Authenticate by email or username
    user = await user_repo.get_by_email(identifier)
    if not user:
        user = await user_repo.get_by_username(identifier)

    if not user or not password_hasher.verify(password, user.password_hash):
        raise InvalidCredentialsError("Invalid email or password")

    # Pass user ID and details inside the token
    token = token_service.generate_token(
        user_id=user.id,
        email=user.email,
        username=user.username,
    )

    return TokenResponse(
        token=token,
        access_token=token,
        token_type="bearer",
    )


@router.post(
    "/auth",
    response_model=TokenResponse,
    summary="Generate Bearer Token via Basic Auth (or JSON/Form)",
    description="Autentica utilizando HTTP Basic Auth (usuário/e-mail e senha) e retorna o Bearer Token contendo o ID do usuário.",
)
async def authenticate_post(
    request: Request,
    response: Response,
    basic_creds: Optional[HTTPBasicCredentials] = Depends(http_basic),
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    token_service: TokenService = Depends(get_token_service),
) -> TokenResponse:
    identifier, password = await extract_credentials(request, basic_creds)
    result = await _authenticate_and_issue_token(
        identifier,
        password,
        user_repo,
        password_hasher,
        token_service,
    )
    _set_auth_cookie(response, result.access_token)
    return result


def _set_auth_cookie(response: Response, token: str) -> None:
    """JWT em cookie httpOnly: o JavaScript do front nunca enxerga o token (mitiga XSS).
    SameSite=Strict + front servido na mesma origem (proxy /api) cobre CSRF."""
    settings = get_settings()
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.JWT_EXPIRES_MINUTES * 60,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="strict",
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerra a sessão do front-end (remove o cookie httpOnly)",
)
async def logout(response: Response) -> Response:
    settings = get_settings()
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="strict",
    )
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get(
    "/auth",
    response_model=TokenResponse,
    summary="Generate Bearer Token via HTTP Basic Auth header",
    description="Autentica via cabeçalho HTTP Basic Auth padrão e retorna o Bearer Token contendo o ID do usuário.",
)
async def authenticate_get(
    request: Request,
    basic_creds: Optional[HTTPBasicCredentials] = Depends(http_basic),
    user_repo: AsyncpgUserRepository = Depends(get_user_repository),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    token_service: TokenService = Depends(get_token_service),
) -> TokenResponse:
    identifier, password = await extract_credentials(request, basic_creds)
    return await _authenticate_and_issue_token(
        identifier,
        password,
        user_repo,
        password_hasher,
        token_service,
    )
