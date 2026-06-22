from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Analytics Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DEBUG: bool = True

    # Database — Analytics owns FinancialIndicator & FinancialMetric
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "ent_dash_analytics"
    POSTGRES_PORT: str = "5432"

    @property
    def sqlalchemy_database_uri(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # JWT — identical SECRET_KEY as IAM service for token validation
    # No default — service will fail to start if SECRET_KEY is not set in environment.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # AI Integration
    GEMINI_API_KEY: str = ""

    # Kafka Integration (Consumer)
    KAFKA_BOOTSTRAP_SERVERS: str = "redpanda:9092"
    KAFKA_TOPIC_DATA_PROCESSED: str = "engine.data_processed"
    KAFKA_CONSUMER_GROUP: str = "analytics-group"

    # Engine gRPC connection — configurable via env var for multi-env deploys
    ENGINE_GRPC_HOST: str = "engine"
    ENGINE_GRPC_PORT: int = 50051

    @property
    def engine_grpc_address(self) -> str:
        return f"{self.ENGINE_GRPC_HOST}:{self.ENGINE_GRPC_PORT}"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080,http://localhost"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
