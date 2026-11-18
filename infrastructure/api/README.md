# API Infrastructure (`api`)

Camada de interface HTTP utilizando **FastAPI** e **Pydantic**, fornecendo os endpoints REST do Bytebank.

## Endpoints
- `GET /health`: Healthcheck do sistema.
- `GET /user`: Lista usuários cadastrados.
- `POST /user`: Cria novo usuário e inicializa conta bancária.
- `POST /user/auth`: Autenticação e geração de JWT Bearer Token.
- `GET /account`: Lista contas bancárias do usuário autenticado.
- `POST /account/transaction`: Cria transação (Debit/Credit) debitando ou creditando o saldo.
- `PUT /account/transaction/{id}`: Atualiza uma transação existente.
- `DELETE /account/transaction/{id}`: Exclui transação e reverte o impacto no saldo.
- `GET /account/{accountId}/statement`: Obtém o extrato completo da conta com saldo atualizado e histórico de transações.
