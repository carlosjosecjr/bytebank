from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid
from account.domain.exceptions import InsufficientBalanceError


@dataclass
class Account:
    user_id: str
    account_number: str
    balance: float = 0.0
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def credit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Credit amount must be positive")
        self.balance = round(self.balance + amount, 2)
        self.updated_at = datetime.now(timezone.utc)

    def debit(self, amount: float) -> None:
        if amount <= 0:
            raise ValueError("Debit amount must be positive")
        if self.balance < amount:
            raise InsufficientBalanceError("Insufficient account balance")
        self.balance = round(self.balance - amount, 2)
        self.updated_at = datetime.now(timezone.utc)
