# Transaction Foundation (`transaction`)

Pacote responsável pelo domínio e regras de negócio de Transações financeiras (Débito e Crédito) no sistema Bytebank.

## Estrutura
- `transaction.domain`: Entidade `Transaction`, enum `TransactionType` (Debit/Credit), exceções e contrato de repositório (`TransactionRepository`).
- `transaction.application`: Casos de uso (`CreateTransactionUseCase`, `UpdateTransactionUseCase`, `DeleteTransactionUseCase`, `ListTransactionsUseCase`, `GetTransactionByIdUseCase`), DTOs e contrato de ajuste de saldo (`AccountBalanceService`).
