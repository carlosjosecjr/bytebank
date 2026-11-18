from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class CreateAccountInput:
    user_id: str
    account_number: Optional[str] = None
    initial_balance: float = 0.0


@dataclass(frozen=True)
class AccountOutput:
    id: str
    user_id: str
    account_number: str
    balance: float
    created_at: datetime


@dataclass(frozen=True)
class StatementTransactionItem:
    id: str
    account_id: str
    value: float
    type: str
    from_party: str
    to_party: str
    anexo: Optional[str]
    url_anexo: Optional[str]
    created_at: datetime


@dataclass(frozen=True)
class AccountStatementOutput:
    account: AccountOutput
    transactions: list[StatementTransactionItem]
    total: int = 0
    limit: Optional[int] = None
    offset: int = 0
