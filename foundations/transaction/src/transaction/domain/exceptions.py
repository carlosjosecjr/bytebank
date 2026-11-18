class TransactionError(Exception):
    """Base exception for transaction domain errors."""
    pass


class TransactionNotFoundError(TransactionError):
    def __init__(self, message: str = "Transaction not found") -> None:
        super().__init__(message)


class InvalidTransactionError(TransactionError):
    def __init__(self, message: str = "Invalid transaction data") -> None:
        super().__init__(message)


class UnauthorizedTransactionError(TransactionError):
    def __init__(self, message: str = "Unauthorized transaction operation") -> None:
        super().__init__(message)
