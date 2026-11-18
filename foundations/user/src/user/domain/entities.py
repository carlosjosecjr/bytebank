from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid


@dataclass
class User:
    username: str
    email: str
    password_hash: str
    name: str = ""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if not self.name:
            self.name = self.username
