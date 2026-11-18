from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
import uuid


class TransactionType(str, Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"

    @classmethod
    def from_str(cls, value: str) -> "TransactionType":
        val_lower = value.strip().lower()
        if val_lower == "debit":
            return cls.DEBIT
        if val_lower == "credit":
            return cls.CREDIT
        raise ValueError(f"Invalid transaction type: {value}. Must be 'Debit' or 'Credit'")


@dataclass
class Transaction:
    account_id: str
    value: float
    type: TransactionType
    from_party: str
    to_party: str
    anexo: Optional[str] = None
    url_anexo: Optional[str] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if isinstance(self.type, str) and not isinstance(self.type, TransactionType):
            self.type = TransactionType.from_str(self.type)
        if self.value <= 0:
            raise ValueError("Transaction value must be positive")
