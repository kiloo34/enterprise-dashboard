import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base
# Import all models so they are registered with Base.metadata
from app.models.rekon import RekonQrisAj, RekonQrisOnus, RekonQrisRintis  # noqa: F401

async def init_db():
    # 1. Create schemas if not exist using a synchronous connection to ensure immediate commit
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS app"))
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS rekon"))
        # Using engine.begin() guarantees commit on exit of block

    # 2. Create all tables in a separate connection block
    async with engine.begin() as conn:
        
        # 2. Create all tables
        # By importing app.models, all classes are registered with Base.metadata
        import app.models # noqa
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database schemas (app, rekon) and all tables initialized successfully!")

if __name__ == "__main__":
    asyncio.run(init_db())
