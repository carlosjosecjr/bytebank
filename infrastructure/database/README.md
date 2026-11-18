# Database Infrastructure (`database`)

Pacote de infraestrutura para persistência de dados utilizando **exclusivamente `asyncpg`** e adotando o **estilo do SQLc** (raw SQL com métodos tipados, sem ORM e sem SQLAlchemy).

## Arquitetura SQLc

```text
infrastructure/database/
├── sql/
│   ├── schema.sql           # DDL das tabelas (users, accounts, transactions)
│   └── queries/             # Arquivos de queries SQL com anotações SQLc
│       ├── users.sql        # Anotações -- name: ... :one / :many
│       ├── accounts.sql     # Anotações -- name: ... :one / :many
│       └── transactions.sql # Anotações -- name: ... :one / :many / :execresult
└── src/database/
    ├── connection/          # Gerenciamento de pool (asyncpg.Pool) e init_db
    ├── sqlc/
    │   ├── models.py        # Dataclasses de linhas (UserRow, AccountRow, TransactionRow)
    │   └── querier.py       # Classe Querier tipada executando SQL nativo com asyncpg
    └── repository/          # Implementações dos repositórios do domínio usando o Querier
```

## Benefícios da Abordagem
- **Zero ORM Overhead**: Máxima performance com o driver assíncrono nativo de PostgreSQL (`asyncpg`).
- **Consultas SQL Explícitas**: Total controle e visibilidade sobre as queries executadas no banco.
- **Tipagem Estrita**: Mapeamento direto entre records do asyncpg e dataclasses tipadas.
- **Isolamento de Domínio**: As entidades de domínio (`User`, `Account`, `Transaction`) permanecem puras e desacopladas da camada de persistência.
