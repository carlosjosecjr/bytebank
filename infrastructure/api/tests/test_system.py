import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Bytebank" in data["app"]


@pytest.mark.asyncio
async def test_static_files(client: AsyncClient):
    response = await client.get("/public/index.html")
    assert response.status_code == 200
    assert "Bytebank" in response.text
