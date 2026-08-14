from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Dashboard API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/recon"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str  # No default — service fails to start if not set
    POSTGRES_DB: str = "cbskonv"
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
    CELERY_BROKER_URL: str = "redis://redis:6379/0"

    # Reconciliation windowing — controls how much historical data each task processes.
    # RECON_LOOKBACK_DAYS: only reconcile transactions from the last N days.
    # RECON_MAX_ROWS: hard cap on rows loaded into memory per task run.
    RECON_LOOKBACK_DAYS: int = 7
    RECON_MAX_ROWS: int = 500000

    # Kafka Config
    KAFKA_BOOTSTRAP_SERVERS: str = "redpanda:9092"
    KAFKA_TOPIC_DATA_PROCESSED: str = "engine.data_processed"
    KAFKA_CONSUMER_GROUP: str = "recon-group"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
