"""Sessão do front-end: JWT em cookie httpOnly + /user/me."""
import pytest
from httpx import AsyncClient

USER = {"username": "joana", "email": "joana@bytebank.com", "password": "secret123", "name": "Joana Silva"}


async def _signup_and_login(client: AsyncClient, user: dict[str, str] = USER) -> None:
    res = await client.post("/user", json=user)
    assert res.status_code == 201, res.text
    res = await client.post(
        "/user/auth",
        data={"grant_type": "password", "username": user["email"], "password": user["password"]},
    )
    assert res.status_code == 200, res.text


@pytest.mark.asyncio
async def test_login_sets_httponly_cookie_and_cookie_authenticates(client: AsyncClient):
    await _signup_and_login(client)

    # Os detalhes de segurança ficam no header Set-Cookie (httpx não os expõe no jar)
    res = await client.post(
        "/user/auth",
        data={"grant_type": "password", "username": USER["email"], "password": USER["password"]},
    )
    set_cookie = res.headers["set-cookie"].lower()
    assert set_cookie.startswith("access_token=")
    assert "httponly" in set_cookie
    assert "samesite=strict" in set_cookie
    assert "path=/" in set_cookie

    # Sem header Authorization: só o cookie (guardado no jar do client) autentica
    res = await client.get("/account")
    assert res.status_code == 200, res.text
    assert len(res.json()) == 1


@pytest.mark.asyncio
async def test_protected_route_without_credentials_is_401(client: AsyncClient):
    res = await client.get("/account")
    assert res.status_code == 401
    res = await client.get("/user/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_logout_clears_cookie(client: AsyncClient):
    await _signup_and_login(client)
    assert (await client.get("/user/me")).status_code == 200

    res = await client.post("/user/logout")
    assert res.status_code == 204
    assert "access_token=" in res.headers["set-cookie"]
    assert "max-age=0" in res.headers["set-cookie"].lower()

    assert (await client.get("/user/me")).status_code == 401


@pytest.mark.asyncio
async def test_get_and_update_me(client: AsyncClient):
    await _signup_and_login(client)

    res = await client.get("/user/me")
    assert res.status_code == 200
    assert res.json()["name"] == "Joana Silva"
    assert res.json()["email"] == USER["email"]

    res = await client.put("/user/me", json={"name": "Joana da Silva Oliveira", "email": "joana.o@bytebank.com"})
    assert res.status_code == 200, res.text
    assert res.json()["name"] == "Joana da Silva Oliveira"
    assert res.json()["email"] == "joana.o@bytebank.com"

    # Troca de senha: a nova senha passa a autenticar e a antiga não
    res = await client.put("/user/me", json={"password": "nova-senha-123"})
    assert res.status_code == 200
    client.cookies.clear()
    bad = await client.post("/user/auth", data={"grant_type": "password", "username": "joana.o@bytebank.com", "password": USER["password"]})
    assert bad.status_code == 401
    ok = await client.post("/user/auth", data={"grant_type": "password", "username": "joana.o@bytebank.com", "password": "nova-senha-123"})
    assert ok.status_code == 200


@pytest.mark.asyncio
async def test_update_me_with_email_of_another_user_is_409(client: AsyncClient):
    other = {"username": "pedro", "email": "pedro@bytebank.com", "password": "secret123", "name": "Pedro"}
    assert (await client.post("/user", json=other)).status_code == 201
    await _signup_and_login(client)

    res = await client.put("/user/me", json={"email": "pedro@bytebank.com"})
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_update_me_validates_payload(client: AsyncClient):
    await _signup_and_login(client)
    assert (await client.put("/user/me", json={"password": "123"})).status_code == 422
    assert (await client.put("/user/me", json={"email": "nao-e-email"})).status_code == 422
