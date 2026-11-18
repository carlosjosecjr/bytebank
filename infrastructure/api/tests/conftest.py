import os
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
import asyncpg
from database.connection.session import get_pool, init_db
from api.dependencies import get_db
from api.app import create_app

TEST_DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://bytebank:bytebank_secret_password@localhost:5432/bytebank",
)
if TEST_DB_URL.startswith("postgresql+asyncpg://"):
    TEST_DB_URL = TEST_DB_URL.replace("postgresql+asyncpg://", "postgresql://", 1)


@pytest_asyncio.fixture(autouse=True)
async def setup_and_clean_test_database():
    await init_db(TEST_DB_URL)
    pool = await get_pool(TEST_DB_URL)
    async with pool.acquire() as conn:
        await conn.execute("TRUNCATE TABLE transactions, accounts, users CASCADE;")
    yield


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_app()
    pool = await get_pool(TEST_DB_URL)

    async def override_get_db() -> AsyncGenerator[asyncpg.Connection, None]:
        async with pool.acquire() as conn:
            yield conn

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
