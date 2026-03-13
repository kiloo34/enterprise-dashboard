import asyncio
import logging

from app.db.session import AsyncSessionLocal
from app.services.engine import get_engine_logs, get_engine_stats

logging.basicConfig(level=logging.INFO)

async def test_engine_api():
    async with AsyncSessionLocal() as db:
        print("Testing getting stats...")
        try:
            stats = await get_engine_stats(db)
            print("Stats:")
            print(stats)
        except Exception as e:
            print(f"Stats error: {e}")

        print("\nTesting getting logs...")
        try:
            logs = await get_engine_logs(db, limit=5)
            print("Logs:")
            for log in logs:
                print(log)
        except Exception as e:
            print(f"Logs error: {e}")

if __name__ == "__main__":
    asyncio.run(test_engine_api())
