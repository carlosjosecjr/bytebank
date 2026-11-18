import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_users(client: AsyncClient):
    # 1. Create a user
    payload = {
        "username": "carlos",
        "email": "carlos@bytebank.com",
        "password": "password123",
        "name": "Carlos Silva",
    }
    response = await client.post("/user", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "carlos"
    assert data["name"] == "Carlos Silva"
    assert data["email"] == "carlos@bytebank.com"
    assert "id" in data

    # 2. List users
    list_response = await client.get("/user")
    assert list_response.status_code == 200
    users = list_response.json()
    assert len(users) == 1
    assert users[0]["email"] == "carlos@bytebank.com"
    assert users[0]["name"] == "Carlos Silva"

    # 3. Create duplicate user should fail (409)
    dup_response = await client.post("/user", json=payload)
    assert dup_response.status_code == 409
