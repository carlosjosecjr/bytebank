from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class CreateUserInput:
    username: str
    email: str
    password: str
    name: Optional[str] = None


@dataclass(frozen=True)
class UpdateUserInput:
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


@dataclass(frozen=True)
class UserOutput:
    id: str
    name: str
    email: str
    username: str
    created_at: datetime


@dataclass(frozen=True)
class AuthInput:
    email: str
    password: str


@dataclass(frozen=True)
class AuthOutput:
    token: str
    token_type: str = "bearer"
