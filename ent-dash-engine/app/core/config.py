from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Data Engine Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = False

    # Database — Engine owns FileImport & processing state
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str  # No default — service fails to start if not set
    POSTGRES_DB: str = "ent_dash_engine"
    POSTGRES_PORT: str = "5432"

    # Recon DB — for writing rekon.* tables that the Recon service reads
    RECON_DATABASE_URI: str = ""

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @property
    def recon_database_uri_sync(self) -> str:
        """Sync psycopg2 URI for Celery worker to write to Recon DB."""
        if self.RECON_DATABASE_URI:
            return self.RECON_DATABASE_URI.replace("postgresql+asyncpg", "postgresql+psycopg2").replace("asyncpg", "psycopg2")
        # Fallback: derive from engine DB settings, swap DB name
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/ent_dash_recon"
        )

    # JWT — same SECRET as IAM for token validation (stateless)
    # No default — service will fail to start if SECRET_KEY is not set in environment.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # Celery (internal task queue)
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # MinIO (Object Storage for big files)
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str  # No default — service fails to start if not set
    MINIO_SECRET_KEY: str  # No default — service fails to start if not set
    MINIO_BUCKET: str = "ent-dash-imports"
    MINIO_USE_SSL: bool = False

    # Kafka / Redpanda (Event streaming)
    KAFKA_BOOTSTRAP_SERVERS: str = "redpanda:9092"
    KAFKA_TOPIC_FILE_UPLOADED: str = "engine.file_uploaded"
    KAFKA_TOPIC_DATA_PROCESSED: str = "engine.data_processed"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
