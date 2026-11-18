from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    APP_NAME: str = "Bytebank Financial API"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DATABASE_URL: str = "postgresql://bytebank:bytebank_secret_password@localhost:5432/bytebank"
    JWT_SECRET: str = "bytebank-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MINUTES: int = 60 * 24  # 24 hours
    PUBLIC_DIR: str = "./public"

    # Cookie httpOnly com o JWT (usado pelo front-end). Em produção (HTTPS), COOKIE_SECURE=true.
    AUTH_COOKIE_NAME: str = "access_token"
    COOKIE_SECURE: bool = False
    # Origens liberadas no CORS (JSON no .env: CORS_ORIGINS=["https://..."])
    CORS_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:8080"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> AppSettings:
    return AppSettings()
