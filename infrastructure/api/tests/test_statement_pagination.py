"""Extrato paginado: GET /account/{id}/statement?limit=&offset= (mais recentes primeiro)."""
import pytest
from httpx import AsyncClient


async def _setup(client: AsyncClient, n: int) -> str:
    user = {"username": "pag", "email": "pag@bytebank.com", "password": "secret123", "name": "Pag"}
    assert (await client.post("/user", json=user)).status_code == 201
    res = await client.post("/user/auth", data={"grant_type": "password", "username": user["email"], "password": user["password"]})
    assert res.status_code == 200
    account_id = (await client.get("/account")).json()[0]["id"]
    for i in range(1, n + 1):
        res = await client.post(
            "/account/transaction",
            json={"accountId": account_id, "value": i, "type": "Credit", "from": "Depósito", "to": "conta"},
        )
        assert res.status_code == 201
    return account_id


@pytest.mark.asyncio
async def test_pages_are_ordered_and_cover_everything_once(client: AsyncClient):
    account_id = await _setup(client, 7)

    first = (await client.get(f"/account/{account_id}/statement", params={"limit": 3})).json()
    assert first["total"] == 7
    assert first["limit"] == 3 and first["offset"] == 0
    assert first["hasMore"] is True
    # Mais recentes primeiro: a última criada (valor 7) vem antes
    assert [t["value"] for t in first["transactions"]] == [7, 6, 5]

    seen = [t["id"] for t in first["transactions"]]
    offset = 3
    while True:
        page = (await client.get(f"/account/{account_id}/statement", params={"limit": 3, "offset": offset})).json()
        seen += [t["id"] for t in page["transactions"]]
        offset += len(page["transactions"])
        if not page["hasMore"]:
            break

    assert len(seen) == 7
    assert len(set(seen)) == 7  # sem repetição entre páginas
    assert page["transactions"][-1]["value"] == 1


@pytest.mark.asyncio
async def test_without_limit_returns_full_statement(client: AsyncClient):
    account_id = await _setup(client, 4)
    body = (await client.get(f"/account/{account_id}/statement")).json()
    assert len(body["transactions"]) == 4
    assert body["total"] == 4
    assert body["limit"] is None
    assert body["hasMore"] is False


@pytest.mark.asyncio
async def test_offset_past_the_end_is_empty_page(client: AsyncClient):
    account_id = await _setup(client, 2)
    body = (await client.get(f"/account/{account_id}/statement", params={"limit": 5, "offset": 10})).json()
    assert body["transactions"] == []
    assert body["total"] == 2
    assert body["hasMore"] is False


@pytest.mark.asyncio
async def test_invalid_pagination_params_are_422(client: AsyncClient):
    account_id = await _setup(client, 1)
    for params in ({"limit": 0}, {"limit": 101}, {"offset": -1}):
        res = await client.get(f"/account/{account_id}/statement", params=params)
        assert res.status_code == 422, params
