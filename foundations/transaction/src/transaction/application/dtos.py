from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class CreateTransactionInput:
    account_id: str
    value: float
    type: str  # "Debit" or "Credit"
    from_party: str
    to_party: str
    anexo: Optional[str] = None
    url_anexo: Optional[str] = None
    user_id: Optional[str] = None


@dataclass(frozen=True)
class UpdateTransactionInput:
    transaction_id: str
    value: Optional[float] = None
    type: Optional[str] = None
    from_party: Optional[str] = None
    to_party: Optional[str] = None
    anexo: Optional[str] = None
    url_anexo: Optional[str] = None
    user_id: Optional[str] = None


@dataclass(frozen=True)
class TransactionOutput:
    id: str
    account_id: str
    value: float
    type: str
    from_party: str
    to_party: str
    anexo: Optional[str]
    url_anexo: Optional[str]
    created_at: datetime
