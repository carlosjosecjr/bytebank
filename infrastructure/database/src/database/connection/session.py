import os
from pathlib import Path
from typing import AsyncGenerator
import asyncpg

_pool: asyncpg.Pool | None = None


def get_database_url() -> str:
    url = os.getenv(
        "DATABASE_URL",
        "postgresql://bytebank:bytebank_secret_password@localhost:5432/bytebank",
    )
    # Normalize if someone passes postgresql+asyncpg://
    if url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql+asyncpg://", "postgresql://", 1)
    if url.startswith("postgres+asyncpg://"):
        url = url.replace("postgres+asyncpg://", "postgresql://", 1)
    return url


async def get_pool(database_url: str | None = None) -> asyncpg.Pool:
    global _pool
    if _pool is None or _pool._closed or database_url is not None:
        url = database_url or get_database_url()
        pool = await asyncpg.create_pool(
            dsn=url,
            min_size=2,
            max_size=20,
        )
        if database_url is None:
            _pool = pool
        return pool
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None and not _pool._closed:
        await _pool.close()
        _pool = None


async def init_db(database_url: str | None = None) -> None:
    pool = await get_pool(database_url)
    schema_path = Path(__file__).resolve().parent.parent.parent.parent / "sql" / "schema.sql"
    if not schema_path.exists():
        # Fallback location check
        schema_path = Path("/home/carlos/workspace/bytebank/infrastructure/database/sql/schema.sql")

    schema_sql = schema_path.read_text(encoding="utf-8")

    async with pool.acquire() as conn:
        await conn.execute(schema_sql)


async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


# Backward-compatible alias
get_session = get_connection
