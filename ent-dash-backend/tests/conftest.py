import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport

from app.main import app

# Use a local PostgreSQL instance for tests since SQLAlchemy models contain Postgres-specific syntax
# Assuming docker-compose DB port 5432, we test against a specific test database or default
# TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

# engine = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)

# TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# @pytest.fixture(scope="session", autouse=True)
# async def setup_test_db():
#     """Setup the database once per test session."""
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)
#     yield
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.drop_all)

# @pytest.fixture
# async def db_session() -> AsyncGenerator[AsyncSession, None]:
#     """Provide a transactional scope around a series of operations."""
#     async with TestingSessionLocal() as session:
#         yield session

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Create an http client."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
