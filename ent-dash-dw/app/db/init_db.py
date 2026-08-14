"""
DW DB Initialization.

Creates the three schemas (rekon, DATAWARE, TABLEAU_REPORT) and all tables
idempotently on every service startup via Base.metadata.create_all.

NOTE: DATAWARE and TABLEAU_REPORT use uppercase names and therefore require
quoted identifiers in PostgreSQL DDL: "DATAWARE", "TABLEAU_REPORT".
"""
import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # noqa: F401

# ── Model imports — must happen before Base.metadata.create_all ──────────────
# init_db.py is a leaf module (nothing imports it except main.py lifespan),
# so it is safe to aggregate all models here without risk of circular imports.
from app.models.engine import (  # noqa: F401
    EngineProcessGroup, EngineProcessGroupHis,
    EngineStsLoadData, EngineStsLoadDataHis,
    EngineStsProseRpt, EngineStsProseRptHis,
    EngineJobEntryLog, EngineJobLog, EngineSettingDb,
)

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Create schemas and all tables if they don't exist. Safe to call on every startup."""
    try:
        # 1. Create the three schemas idempotently.
        #    DATAWARE and TABLEAU_REPORT are uppercase — must be quoted identifiers.
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS rekon"))
            await conn.execute(text('CREATE SCHEMA IF NOT EXISTS "DATAWARE"'))
            await conn.execute(text('CREATE SCHEMA IF NOT EXISTS "TABLEAU_REPORT"'))
            logger.info("[DW] Schemas 'rekon', 'DATAWARE', 'TABLEAU_REPORT' verified/created.")

        # 2. Create all registered tables (idempotent via checkfirst=True default).
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[DW] Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"[DW] Database initialization failed: {e}")
        raise
