from datetime import datetime, timezone, timedelta
from typing import Any, Optional
import jwt
from api.settings import get_settings


class JwtTokenService:
    def __init__(self, secret: str | None = None, algorithm: str | None = None) -> None:
        settings = get_settings()
        self.secret = secret or settings.JWT_SECRET
        self.algorithm = algorithm or settings.JWT_ALGORITHM
        self.expires_minutes = settings.JWT_EXPIRES_MINUTES

    def generate_token(self, user_id: str, email: str, username: Optional[str] = None) -> str:
        now = datetime.now(timezone.utc)
        payload: dict[str, Any] = {
            "sub": user_id,
            "id": user_id,
            "user_id": user_id,
            "email": email,
            "iat": now,
            "exp": now + timedelta(minutes=self.expires_minutes),
        }
        if username:
            payload["username"] = username
        return jwt.encode(payload, self.secret, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict[str, Any]:
        return jwt.decode(token, self.secret, algorithms=[self.algorithm])
