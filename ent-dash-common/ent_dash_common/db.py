"""
Async SQLAlchemy session factory for all Enterprise Dashboard services.

Usage in each service's app/db/session.py:

    from ent_dash_common.db import make_session_factory, make_get_db
    from app.core.config import settings

    AsyncSessionLocal = make_session_factory(
        settings.sqlalchemy_database_uri,
        pool_size=5,
        max_overflow=10,
    )
    get_db = make_get_db(AsyncSessionLocal)
"""
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def make_session_factory(
    database_uri: str,
    pool_size: int = 5,
    max_overflow: int = 10,
    echo: bool = False,
) -> async_sessionmaker[AsyncSession]:
    """
    Creates and returns an async_sessionmaker bound to the given database URI.

    **Parameters**
    * `database_uri`: Async-compatible SQLAlchemy URI (e.g. postgresql+asyncpg://...)
    * `pool_size`: Number of connections to keep in the pool (default 5)
    * `max_overflow`: Extra connections allowed above pool_size (default 10)
    * `echo`: Log all SQL statements (default False — set True only for debugging)
    """
    engine = create_async_engine(
        database_uri,
        echo=echo,
        future=True,
        pool_size=pool_size,
        max_overflow=max_overflow,
    )
    return async_sessionmaker(
        engine,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


async def _get_db_impl(
    session_factory: async_sessionmaker[AsyncSession],
) -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


def make_get_db(session_factory: async_sessionmaker[AsyncSession]):
    """
    Returns a FastAPI-compatible async generator dependency for DB sessions.

    Usage:
        AsyncSessionLocal = make_session_factory(uri)
        get_db = make_get_db(AsyncSessionLocal)

        # In router:
        async def my_route(db: AsyncSession = Depends(get_db)):
            ...
    """
    async def get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            try:
                yield session
            finally:
                await session.close()

    return get_db
