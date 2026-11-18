class AccountError(Exception):
    """Base exception for account domain errors."""
    pass


class AccountNotFoundError(AccountError):
    def __init__(self, message: str = "Account not found") -> None:
        super().__init__(message)


class UnauthorizedAccountError(AccountError):
    def __init__(self, message: str = "Unauthorized access to account") -> None:
        super().__init__(message)


class InsufficientBalanceError(AccountError):
    def __init__(self, message: str = "Insufficient balance for this transaction") -> None:
        super().__init__(message)


class AccountAlreadyExistsError(AccountError):
    def __init__(self, message: str = "Account number already exists") -> None:
        super().__init__(message)
