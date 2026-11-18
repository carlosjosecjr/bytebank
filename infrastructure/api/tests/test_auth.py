import base64
import pytest
from httpx import AsyncClient
from api.services.token_service import JwtTokenService


@pytest.mark.asyncio
async def test_auth_success_and_failure(client: AsyncClient):
    # Register user
    reg_payload = {
        "username": "auth_user",
        "email": "auth@bytebank.com",
        "password": "secret_password",
    }
    reg_res = await client.post("/user", json=reg_payload)
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]

    # 1. Successful Basic Auth login via POST /user/auth
    creds = base64.b64encode(b"auth@bytebank.com:secret_password").decode("utf-8")
    auth_res = await client.post(
        "/user/auth",
        headers={"Authorization": f"Basic {creds}"},
    )
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert "token" in auth_data
    assert "access_token" in auth_data
    assert auth_data.get("token_type") == "bearer"

    # 2. Verify user ID is passed inside the token
    token = auth_data["token"]
    token_service = JwtTokenService()
    payload = token_service.decode_token(token)
    assert payload.get("sub") == user_id
    assert payload.get("id") == user_id
    assert payload.get("user_id") == user_id
    assert payload.get("email") == "auth@bytebank.com"

    # 3. Failed login with wrong password
    bad_creds = base64.b64encode(b"auth@bytebank.com:wrong_password").decode("utf-8")
    bad_res = await client.post(
        "/user/auth",
        headers={"Authorization": f"Basic {bad_creds}"},
    )
    assert bad_res.status_code == 401

    # 4. Failed login with non-existent user
    notfound_creds = base64.b64encode(b"nonexistent@bytebank.com:secret_password").decode("utf-8")
    notfound_res = await client.post(
        "/user/auth",
        headers={"Authorization": f"Basic {notfound_creds}"},
    )
    assert notfound_res.status_code == 401


@pytest.mark.asyncio
async def test_basic_auth_generates_bearer_token_for_endpoints(client: AsyncClient):
    # Register user
    reg_res = await client.post(
        "/user",
        json={
            "username": "basic_user",
            "email": "basic@bytebank.com",
            "password": "mypassword123",
        },
    )
    user_id = reg_res.json()["id"]

    # 1. Input: Basic Auth on /user/auth -> Output: Bearer Token
    creds = base64.b64encode(b"basic@bytebank.com:mypassword123").decode("utf-8")
    auth_res = await client.post(
        "/user/auth",
        headers={"Authorization": f"Basic {creds}"},
    )
    assert auth_res.status_code == 200
    token = auth_res.json()["token"]

    # Verify user ID in token
    decoded = JwtTokenService().decode_token(token)
    assert decoded["sub"] == user_id

    # 2. Endpoints require the Bearer token
    acc_res = await client.get(
        "/account",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert acc_res.status_code == 200
    accounts = acc_res.json()
    assert len(accounts) >= 1
    assert accounts[0]["userId"] == user_id

    # 3. Request without Bearer token (and without the session cookie) fails (401)
    client.cookies.clear()
    unauth_res = await client.get("/account")
    assert unauth_res.status_code == 401


@pytest.mark.asyncio
async def test_openapi_documentation_schemes(client: AsyncClient):
    res = await client.get("/openapi.json")
    assert res.status_code == 200
    openapi = res.json()

    # Verify security schemes
    schemes = openapi.get("components", {}).get("securitySchemes", {})
    assert "HTTPBasic" in schemes
    assert "OAuth2PasswordBearer" in schemes
    # O botão Authorize do /docs só faz POST quando há um tokenUrl (fluxo OAuth2 password)
    assert schemes["OAuth2PasswordBearer"]["flows"]["password"]["tokenUrl"] == "/user/auth"

    # Verify /user/auth uses HTTPBasic
    paths = openapi.get("paths", {})
    auth_post = paths.get("/user/auth", {}).get("post", {})
    auth_security = auth_post.get("security", [])
    has_basic = any("HTTPBasic" in s for s in auth_security)
    assert has_basic, "Route /user/auth must have HTTPBasic security in OpenAPI"

    # Verify protected endpoint /account uses the Bearer token from the OAuth2 flow
    account_get = paths.get("/account", {}).get("get", {})
    acc_security = account_get.get("security", [])
    has_bearer = any("OAuth2PasswordBearer" in s for s in acc_security)
    assert has_bearer, "Protected route /account must have OAuth2PasswordBearer security in OpenAPI"


@pytest.mark.asyncio
async def test_swagger_password_flow_issues_token(client: AsyncClient):
    """Simula o botão Authorize do /docs: POST form com grant_type=password,
    inclusive com client_id/secret no header Basic (que deve ser ignorado)."""
    await client.post(
        "/user",
        json={"username": "swagger", "email": "swagger@example.com", "password": "secret123", "name": "Swagger User"},
    )
    res = await client.post(
        "/user/auth",
        data={"grant_type": "password", "username": "swagger@example.com", "password": "secret123"},
        auth=("some-client-id", "some-client-secret"),
    )
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    assert res.json()["token_type"] == "bearer"

    res = await client.get("/account", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200, res.text
