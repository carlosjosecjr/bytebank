
# Role: Senior Software Architect & Python Expert

## Contexto do Projeto
Estou reconstruindo um sistema de gerenciamento financeiro do zero. O projeto original era em Node.js, mas o novo deve ser em **Python 3.10+**, utilizando **FastAPI** para a API, **Pydantic** para validação, e seguindo rigorosamente os princípios de **Clean Architecture** (separação entre Domain, Application, Infrastructure e Interface).

O gerenciamento de dependências e o workspace será feito utilizando o **[uv](https://docs.astral.sh/uv/)**.

## Estrutura de Diretórios (Monorepo/Workspace)
O projeto deve seguir estritamente esta estrutura de pastas, onde `foundations` e `infrastructure` são pacotes locais que o entrypoint `src/bytebank` consumirá:

```text
.
├── app
├── foundations
│   ├── transaction
│   │   ├── pyproject.toml
│   │   ├── README.md
│   │   └── src
│   │       └── transaction
│   │           ├── __init__.py
│   │           └── py.typed
│   ├── user
│   │   ├── pyproject.toml
│   │   ├── README.md
│   │   └── src
│   │       └── user
│   │           ├── __init__.py
│   │           └── py.typed
│   └── account
│   │       ├── pyproject.toml
│   │       ├── README.md
│   │       └── src
│   │           └── account
│   │               ├── __init__.py
│   │               └── py.typed
├── infrastructure
│   ├── api
│   │   ├── pyproject.toml
│   │   ├── README.md
│   │   └── src
│   │       ├── api
│   │       │   ├── __init__.py
│   │       │   ├── py.typed
│   │       │   ├── routers
│   │       │   │   ├── auth.py
│   │       │   │   ├── static.py
│   │       │   │   └── users.py
│   │       │   └── settings
│   │       │       └── __init__.py
│   │       └── tests
│   └── database
│       ├── pyproject.toml
│       ├── README.md
│       └── src
│           └── database
│               ├── connection
│               │   └── __init__.py
│               ├── __init__.py
│               ├── py.typed
│               └── repository
│                   └── __init__.py
├── public
├── pyproject.toml
├── README.md
├── src
│   └── bytebank
│       ├── __init__.py
│       └── main.py  <-- Entrypoint da API
├── uv.lock
└── docker-compose.yml
```

## Requisitos de Engenharia

### 1. Arquitetura e Domínio (Foundations)
- **foundations/**: Deve conter a lógica de negócio pura (Entidades e Regras de Negócio). Não deve ter dependências de frameworks (FastAPI) ou bancos de dados (asyncpg).
- **domain/**: Entidades de `user`, `account` e `transaction`.
- **application/**: Casos de uso (Use Cases) que orquestram o fluxo de dados.

### 2. Infraestrutura (Infrastructure)
- **infrastructure/database/**: Implementação dos Repositórios usando **SQLAlchemy** e **PostgreSQL**.
- **infrastructure/api/**: Implementação dos Controllers/Routers do **FastAPI** e configurações de ambiente.

### 3. Entrypoint (src/bytebank)
- O projeto principal deve orquestrar a inicialização da API, conectando as implementações de `infrastructure` com os casos de uso de `foundations`.
- O comando de execução deve ser `uv run bytebank`.

### 4. Contratos de API (Endpoints)
Implemente os seguintes endpoints seguindo o padrão REST:

**Módulo de Usuários (Public):**
- `GET /user`: Lista usuários `[{id, name, email}]`.
- `POST /user`: Cria usuário `{username, email, password}`.
- `POST /user/auth`: Autentica `{email, password}` e retorna `{token: string}` (JWT).

**Módulo de Contas e Transações (Protected - Bearer Token):**
- `GET /account`: Lista contas do usuário.
- `POST /account/transaction`: Cria transação `{accountId, value, type: "Debit"|"Credit", from, to, anexo, urlAnexo}`.
- `PUT /account/transaction/{id}`: Atualiza transação.
- `DELETE /account/transaction/{id}`: Remove transação.
- `GET /account/{accountId}/statement`: Retorna extrato da conta.

### 5. Tecnologias e Padrões
- **Gerenciamento de Dependências:** `uv` (utilizando workspaces para as pastas `foundations` e `infrastructure`).
- **Segurança:** Autenticação via JWT.
- **Tipagem:** Uso rigoroso de `typing` e `py.typed` para garantir que os pacotes sejam tipáveis.
- **Docker:** `Dockerfile` para a aplicação e `docker-compose.yml` para subir a API e o PostgreSQL.

## O que eu preciso agora:
Gere a estrutura inicial de arquivos, incluindo os arquivos `pyproject.toml` de cada subdiretório (configurados para o workspace do `uv`), o `pyproject.toml` raiz, o `Dockerfile`, o `docker-compose.yml` e o esqueleto das classes principais seguindo a Clean Architecture.
```