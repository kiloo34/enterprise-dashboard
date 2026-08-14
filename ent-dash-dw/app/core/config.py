from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Dashboard DW API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/dw"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str  # No default — service fails to start if not set
    POSTGRES_DB: str = "CBSKONV"
    POSTGRES_PORT: str = "5432"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def sync_database_uri(self) -> str:
        return self.sqlalchemy_database_uri.replace("postgresql+asyncpg", "postgresql+psycopg2")

    # JWT
    # No default — service will fail to start if SECRET_KEY is not set in environment.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CELERY_BROKER_URL: str = "redis://redis:6379/0"

    # Kafka Config
    KAFKA_BOOTSTRAP_SERVERS: str = "redpanda:9092"
    KAFKA_TOPIC_DATA_PROCESSED: str = "engine.data_processed"
    KAFKA_CONSUMER_GROUP: str = "dw-group"

    # CORS
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://localhost",
        "http://172.20.10.4",
        "http://172.20.10.4:3000",
    ]

    @property
    def cors_origins(self) -> list[str]:
        return self.ALLOWED_ORIGINS

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
