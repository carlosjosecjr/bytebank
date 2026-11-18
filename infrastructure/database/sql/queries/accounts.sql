-- name: CreateAccount :one
INSERT INTO accounts (id, user_id, account_number, balance, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, user_id, account_number, balance, created_at, updated_at;

-- name: GetAccountById :one
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE id = $1;

-- name: GetAccountByNumber :one
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE account_number = $1;

-- name: ListAccountsByUserId :many
SELECT id, user_id, account_number, balance, created_at, updated_at
FROM accounts
WHERE user_id = $1
ORDER BY created_at ASC;

-- name: UpdateAccountBalance :one
UPDATE accounts
SET balance = $2, updated_at = $3
WHERE id = $1
RETURNING id, user_id, account_number, balance, created_at, updated_at;
