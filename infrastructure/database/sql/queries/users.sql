-- name: CreateUser :one
INSERT INTO users (id, username, name, email, password_hash, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, username, name, email, password_hash, created_at;

-- name: GetUserById :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT id, username, name, email, password_hash, created_at
FROM users
WHERE username = $1;

-- name: ListUsers :many
SELECT id, username, name, email, password_hash, created_at
FROM users
ORDER BY created_at ASC;

-- name: UpdateUser :one
UPDATE users
SET name = $2, email = $3, password_hash = $4
WHERE id = $1
RETURNING id, username, name, email, password_hash, created_at;
