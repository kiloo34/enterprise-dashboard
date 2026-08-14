import asyncio
import logging
from sqlalchemy import text, select
from app.db.session import engine
from app.db.base_class import Base

# ── Model imports — must happen before Base.metadata.create_all ──────────────
# init_db.py is a leaf module (nothing imports it except main.py), so it is
# safe to aggregate all models here without risk of circular imports.
from app.models.user import User, Position, OrganizationUnit            # noqa: F401
from app.models.role_permission import (                                  # noqa: F401
    Role, Permission, ModelHasRole, RoleHasPermission
)
from app.models.audit_log import AuditLog                                # noqa: F401
from app.models.system_config import SystemConfig                        # noqa: F401
from app.models.translation import Translation                           # noqa: F401
from app.core.security import get_password_hash                          # noqa: F401

logger = logging.getLogger(__name__)

def _run_alembic_migrations() -> None:
    """Run pending Alembic migrations synchronously via subprocess to avoid event loop conflicts."""
    import os
    import subprocess
    import sys
    alembic_dir = os.path.join(os.path.dirname(__file__), "..", "..")
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=os.path.abspath(alembic_dir),
        check=True,
    )


async def init_db():
    logger.info("Initializing database schema and tables...")
    
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            # 1. Create schema 'app' if it doesn't exist
            async with engine.begin() as conn:
                await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
                logger.info("Schema 'app' verified/created.")

            # 2. Run Alembic migrations (handles schema drift safely)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, _run_alembic_migrations)
            logger.info("Alembic migrations applied successfully.")

            # 3. Create any remaining tables not yet covered by migrations
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Database tables initialized successfully.")
            
            # 3. Seed if empty
            await seed_initial_data()
            
            return # Success!
            
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Database initialization attempt {attempt + 1} failed: {e}. Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error(f"Failed to initialize database after {max_retries} attempts: {e}")
                raise
async def seed_initial_data():
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # Check if users exist
        result = await db.execute(select(User).limit(1))
        if result.scalars().first():
            logger.info("Database already seeded. Skipping initial seeding.")
        else:
            logger.info("Seeding initial data (base roles and superadmin)...")
            from app.db.seed import seed_data
            await seed_data(db)
            logger.info("Initial seeding completed.")

    # Always run system config seed (idempotent — never overwrites existing values)
    async with AsyncSessionLocal() as db:
        logger.info("Seeding system configuration defaults...")
        from app.db.seed import seed_system_configs
        await seed_system_configs(db)
        logger.info("System config seeding completed.")

    # Always run translation seed (idempotent — never overwrites admin edits)
    async with AsyncSessionLocal() as db:
        logger.info("Seeding UI translation strings...")
        from app.db.seed import seed_translations
        await seed_translations(db)
        logger.info("Translation seeding completed.")

if __name__ == "__main__":
    # For manual trigger
    logging.basicConfig(level=logging.INFO)
    asyncio.run(init_db())
