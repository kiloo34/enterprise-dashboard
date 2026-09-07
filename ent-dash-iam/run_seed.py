import asyncio
import logging
from app.db.session import AsyncSessionLocal
from app.db.seed import seed_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    async with AsyncSessionLocal() as db:
        logger.info("Running seed_data manually...")
        await seed_data(db)
        await db.commit()
        logger.info("Seeding completed and committed.")

if __name__ == "__main__":
    asyncio.run(main())
