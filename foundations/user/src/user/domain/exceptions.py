class UserError(Exception):
    """Base exception for user domain errors."""
    pass


class UserNotFoundError(UserError):
    def __init__(self, message: str = "User not found") -> None:
        super().__init__(message)


class UserAlreadyExistsError(UserError):
    def __init__(self, message: str = "User already exists with this email or username") -> None:
        super().__init__(message)


class InvalidCredentialsError(UserError):
    def __init__(self, message: str = "Invalid email or password") -> None:
        super().__init__(message)
