import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal

async def seed_data(db: AsyncSession):
    # Recon service does not own IAM tables (User, Role, etc.).
    # Seeding is handled by the IAM service.
    pass

async def main():
    async with AsyncSessionLocal() as session:
        await seed_data(session)

if __name__ == "__main__":
    asyncio.run(main())
