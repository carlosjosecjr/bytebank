# Account Foundation (`account`)

Pacote responsável pelo domínio e regras de negócio de Contas no sistema Bytebank.

## Estrutura
- `account.domain`: Entidade `Account`, exceções (`AccountNotFoundError`, `UnauthorizedAccountError`, `InsufficientBalanceError`) e contrato de repositório (`AccountRepository`).
- `account.application`: Casos de uso (`CreateAccountUseCase`, `ListAccountsUseCase`, `GetAccountStatementUseCase`, `GetAccountByIdUseCase`) e DTOs de extrato e conta.
