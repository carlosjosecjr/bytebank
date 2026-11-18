from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class UserRow:
    id: str
    username: str
    name: str
    email: str
    password_hash: str
    created_at: datetime


@dataclass
class AccountRow:
    id: str
    user_id: str
    account_number: str
    balance: float
    created_at: datetime
    updated_at: datetime


@dataclass
class TransactionRow:
    id: str
    account_id: str
    value: float
    type: str
    from_party: str
    to_party: str
    anexo: Optional[str]
    url_anexo: Optional[str]
    created_at: datetime
