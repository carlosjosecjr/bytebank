from datetime import datetime
from typing import Optional
import asyncpg
from database.sqlc.models import UserRow, AccountRow, TransactionRow

# SQL queries with SQLc naming conventions

CREATE_USER = """-- name: CreateUser :one
INSERT INTO users (id, username, name, email, password_hash, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, username, name, email, password_hash, created_at;
"""

GET_USER_BY_ID = """-- name: GetUserById :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE id = $1;
"""

GET_USER_BY_EMAIL = """-- name: GetUserByEmail :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE email = $1;
"""

GET_USER_BY_USERNAME = """-- name: GetUserByUsername :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE username = $1;
"""

LIST_USERS = """-- name: ListUsers :many
SELECT id, username, name, email, password_hash, created_at
FROM users
ORDER BY created_at ASC;
"""

UPDATE_USER = """-- name: UpdateUser :one
UPDATE users
SET name = $2, email = $3, password_hash = $4
WHERE id = $1
RETURNING id, username, name, email, password_hash, created_at;
"""

CREATE_ACCOUNT = """-- name: CreateAccount :one
INSERT INTO accounts (id, user_id, account_number, balance, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, account_number, balance, created_at, updated_at;
"""

GET_ACCOUNT_BY_ID = """-- name: GetAccountById :one
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE id = $1;
"""

GET_ACCOUNT_BY_NUMBER = """-- name: GetAccountByNumber :one
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE account_number = $1;
"""

LIST_ACCOUNTS_BY_USER_ID = """-- name: ListAccountsByUserId :many
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE user_id = $1
ORDER BY created_at ASC;
"""

UPDATE_ACCOUNT_BALANCE = """-- name: UpdateAccountBalance :one
UPDATE accounts
SET balance = $2, updated_at = $3
WHERE id = $1
RETURNING id, user_id, account_number, balance, created_at, updated_at;
"""

CREATE_TRANSACTION = """-- name: CreateTransaction :one
INSERT INTO transactions (id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at;
"""

GET_TRANSACTION_BY_ID = """-- name: GetTransactionById :one
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE id = $1;
"""

LIST_TRANSACTIONS_BY_ACCOUNT_ID = """-- name: ListTransactionsByAccountId :many
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE account_id = $1
ORDER BY created_at DESC;
"""

LIST_TRANSACTIONS_BY_ACCOUNT_ID_PAGED = """-- name: ListTransactionsByAccountIdPaged :many
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE account_id = $1
ORDER BY created_at DESC, id DESC
LIMIT $2 OFFSET $3;
"""

COUNT_TRANSACTIONS_BY_ACCOUNT_ID = """-- name: CountTransactionsByAccountId :one
SELECT COUNT(*)::int AS total
FROM transactions
WHERE account_id = $1;
"""

UPDATE_TRANSACTION = """-- name: UpdateTransaction :one
UPDATE transactions
SET value = $2, type = $3, from_party = $4, to_party = $5, anexo = $6, url_anexo = $7
WHERE id = $1
RETURNING id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at;
"""

DELETE_TRANSACTION = """-- name: DeleteTransaction :execresult
DELETE FROM transactions
WHERE id = $1;
"""


class Querier:
    def __init__(self, conn: asyncpg.Connection) -> None:
        self._conn = conn

    # --- Users ---

    async def create_user(
        self,
        id: str,
        username: str,
        name: str,
        email: str,
        password_hash: str,
        created_at: datetime,
    ) -> UserRow:
        row = await self._conn.fetchrow(
            CREATE_USER,
            id,
            username,
            name,
            email,
            password_hash,
            created_at,
        )
        assert row is not None
        return UserRow(**dict(row))

    async def get_user_by_id(self, id: str) -> Optional[UserRow]:
        row = await self._conn.fetchrow(GET_USER_BY_ID, id)
        return UserRow(**dict(row)) if row else None

    async def get_user_by_email(self, email: str) -> Optional[UserRow]:
        row = await self._conn.fetchrow(GET_USER_BY_EMAIL, email)
        return UserRow(**dict(row)) if row else None

    async def get_user_by_username(self, username: str) -> Optional[UserRow]:
        row = await self._conn.fetchrow(GET_USER_BY_USERNAME, username)
        return UserRow(**dict(row)) if row else None

    async def list_users(self) -> list[UserRow]:
        rows = await self._conn.fetch(LIST_USERS)
        return [UserRow(**dict(r)) for r in rows]

    async def update_user(
        self,
        id: str,
        name: str,
        email: str,
        password_hash: str,
    ) -> Optional[UserRow]:
        row = await self._conn.fetchrow(UPDATE_USER, id, name, email, password_hash)
        return UserRow(**dict(row)) if row else None

    # --- Accounts ---

    async def create_account(
        self,
        id: str,
        user_id: str,
        account_number: str,
        balance: float,
        created_at: datetime,
        updated_at: datetime,
    ) -> AccountRow:
        row = await self._conn.fetchrow(
            CREATE_ACCOUNT,
            id,
            user_id,
            account_number,
            balance,
            created_at,
            updated_at,
        )
        assert row is not None
        return AccountRow(**dict(row))

    async def get_account_by_id(self, id: str) -> Optional[AccountRow]:
        row = await self._conn.fetchrow(GET_ACCOUNT_BY_ID, id)
        return AccountRow(**dict(row)) if row else None

    async def get_account_by_number(self, account_number: str) -> Optional[AccountRow]:
        row = await self._conn.fetchrow(GET_ACCOUNT_BY_NUMBER, account_number)
        return AccountRow(**dict(row)) if row else None

    async def list_accounts_by_user_id(self, user_id: str) -> list[AccountRow]:
        rows = await self._conn.fetch(LIST_ACCOUNTS_BY_USER_ID, user_id)
        return [AccountRow(**dict(r)) for r in rows]

    async def update_account_balance(
        self,
        id: str,
        balance: float,
        updated_at: datetime,
    ) -> Optional[AccountRow]:
        row = await self._conn.fetchrow(
            UPDATE_ACCOUNT_BALANCE,
            id,
            balance,
            updated_at,
        )
        return AccountRow(**dict(row)) if row else None

    # --- Transactions ---

    async def create_transaction(
        self,
        id: str,
        account_id: str,
        value: float,
        type: str,
        from_party: str,
        to_party: str,
        anexo: Optional[str],
        url_anexo: Optional[str],
        created_at: datetime,
    ) -> TransactionRow:
        row = await self._conn.fetchrow(
            CREATE_TRANSACTION,
            id,
            account_id,
            value,
            type,
            from_party,
            to_party,
            anexo,
            url_anexo,
            created_at,
        )
        assert row is not None
        return TransactionRow(**dict(row))

    async def get_transaction_by_id(self, id: str) -> Optional[TransactionRow]:
        row = await self._conn.fetchrow(GET_TRANSACTION_BY_ID, id)
        return TransactionRow(**dict(row)) if row else None

    async def list_transactions_by_account_id(self, account_id: str) -> list[TransactionRow]:
        rows = await self._conn.fetch(LIST_TRANSACTIONS_BY_ACCOUNT_ID, account_id)
        return [TransactionRow(**dict(r)) for r in rows]

    async def list_transactions_by_account_id_paged(
        self, account_id: str, limit: int, offset: int
    ) -> list[TransactionRow]:
        rows = await self._conn.fetch(LIST_TRANSACTIONS_BY_ACCOUNT_ID_PAGED, account_id, limit, offset)
        return [TransactionRow(**dict(r)) for r in rows]

    async def count_transactions_by_account_id(self, account_id: str) -> int:
        total = await self._conn.fetchval(COUNT_TRANSACTIONS_BY_ACCOUNT_ID, account_id)
        return int(total or 0)

    async def update_transaction(
        self,
        id: str,
        value: float,
        type: str,
        from_party: str,
        to_party: str,
        anexo: Optional[str],
        url_anexo: Optional[str],
    ) -> Optional[TransactionRow]:
        row = await self._conn.fetchrow(
            UPDATE_TRANSACTION,
            id,
            value,
            type,
            from_party,
            to_party,
            anexo,
            url_anexo,
        )
        return TransactionRow(**dict(row)) if row else None

    async def delete_transaction(self, id: str) -> str:
        status = await self._conn.execute(DELETE_TRANSACTION, id)
        return status
