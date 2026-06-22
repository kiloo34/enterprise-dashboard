"""
Shared pytest fixtures for IAM backend tests.

Uses SQLite (aiosqlite) in-memory so tests are fast and
do NOT require a running PostgreSQL instance.
"""
import pytest
import pytest_asyncio
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.base_class import Base


# ── SQLite in-memory engine ────────────────────────────────────────────────────
DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield a fresh AsyncSession backed by an in-memory SQLite DB.
    All tables are created before the test and dropped afterwards.
    Each test function gets an isolated database.
    """
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()
