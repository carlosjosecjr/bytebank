# User Foundation (`user`)

Pacote responsável pelo domínio e casos de uso de Usuários no sistema Bytebank.

## Estrutura
- `user.domain`: Entidade `User`, exceções (`UserNotFoundError`, `UserAlreadyExistsError`, etc.) e contrato de repositório (`UserRepository`).
- `user.application`: Casos de uso (`CreateUserUseCase`, `ListUsersUseCase`, `AuthenticateUserUseCase`, `GetUserByIdUseCase`), DTOs e serviço de hashing de senha (`BcryptPasswordHasher`).
