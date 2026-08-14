"""
Engine DB Initialization.

Menggunakan `create_all` untuk memastikan tabel ada saat startup.
Engine hanya memiliki schema `app` dan tabel `file_imports`.
Tabel engine_* (rekon schema) sudah dipindah ke service ent-dash-dw.
"""
import logging
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # noqa: F401

# ── Model imports — must happen before Base.metadata.create_all ──────────────
from app.models.imports import FileImport        # noqa: F401

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Create all tables if they don't exist. Safe to call on every startup."""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
            logger.info("[Engine] Schema 'app' verified/created.")

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("[Engine] Database tables verified/created successfully.")
    except Exception as e:
        logger.error(f"[Engine] Database initialization failed: {e}")
        raise
