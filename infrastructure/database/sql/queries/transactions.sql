-- name: CreateTransaction :one
INSERT INTO transactions (id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at;

-- name: GetTransactionById :one
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE id = $1;

-- name: ListTransactionsByAccountId :many
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE account_id = $1
ORDER BY created_at DESC;

-- name: UpdateTransaction :one
UPDATE transactions
SET value = $2, type = $3, from_party = $4, to_party = $5, anexo = $6, url_anexo = $7
WHERE id = $1
RETURNING id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at;

-- name: DeleteTransaction :execresult
DELETE FROM transactions
WHERE id = $1;

-- name: ListTransactionsByAccountIdPaged :many
SELECT id, account_id, value, type, from_party, to_party, anexo, url_anexo, created_at
FROM transactions
WHERE account_id = $1
ORDER BY created_at DESC, id DESC
LIMIT $2 OFFSET $3;

-- name: CountTransactionsByAccountId :one
SELECT COUNT(*)::int AS total
FROM transactions
WHERE account_id = $1;
