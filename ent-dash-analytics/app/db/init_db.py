import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # noqa: F401
# Import models to register them with Base.metadata
from app.models.financial import FinancialIndicator, FinancialMetric

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Create all tables if they don't exist. Safe to call on every startup."""
    try:
        # Create schema 'app' if it doesn't exist
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
            logger.info("[Analytics] Schema 'app' verified/created.")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Analytics] Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"[Analytics] Database initialization failed: {e}")
        raise
