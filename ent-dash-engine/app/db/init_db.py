"""
Engine DB Initialization.

Menggunakan `create_all` untuk memastikan tabel ada saat startup.
Engine tidak pakai Alembic untuk initial create (cukup untuk service ini),
tapi Alembic tetap dipakai untuk schema migrations setelah tabel ada.
"""
import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # noqa: F401

# ── Model imports — must happen before Base.metadata.create_all ──────────────
# init_db.py is a leaf module (nothing imports it except main.py), so it is
# safe to aggregate all models here without risk of circular imports.
from app.models.engine import (                  # noqa: F401
    EngineProcessGroup, EngineProcessGroupHis,
    EngineStsLoadData, EngineStsLoadDataHis,
    EngineStsProseRpt, EngineStsProseRptHis,
    EngineJobEntryLog, EngineJobLog, EngineSettingDb,
)
from app.models.imports import FileImport        # noqa: F401

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Create all tables if they don't exist. Safe to call on every startup."""
    try:
        # Create schemas if they don't exist
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS rekon"))
            logger.info("[Engine] Schemas 'app' and 'rekon' verified/created.")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Engine] Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"[Engine] Database initialization failed: {e}")
        raise
