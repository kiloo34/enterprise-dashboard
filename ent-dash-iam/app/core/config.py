from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "IAM Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = False

    # Internal service URLs — configurable via env var for multi-env deploys
    ENGINE_INTERNAL_URL: str = "http://engine:8000"

    # Database — IAM uses its own isolated DB
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str  # No default — service fails to start if not set
    POSTGRES_DB: str = "ent_dash_iam"
    POSTGRES_PORT: str = "5432"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT — SECRET_KEY is shared across services for token verification
    # No default — service will fail to start if SECRET_KEY is not set in environment.
    # This enforces that operators always provide a strong secret.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # K2 fix: Access token 15 menit
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # K2 fix: Refresh token 7 hari

    # Cookie security — terpisah dari DEBUG agar HTTPS selalu dienforce di production.
    # Set COOKIE_SECURE=false hanya di local dev tanpa HTTPS.
    COOKIE_SECURE: bool = True

    # CORS — eksplisit via env var, tidak bergantung flag DEBUG
    # Set ALLOWED_ORIGINS="http://yourdomain.com,http://app.internal" di production
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost"

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated origins string into list."""
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
