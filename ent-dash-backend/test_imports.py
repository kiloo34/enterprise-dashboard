import asyncio
import logging

from app.db.session import AsyncSessionLocal
from app.services.imports import get_all_imports

logging.basicConfig(level=logging.INFO)

async def test_import_list():
    async with AsyncSessionLocal() as db:
        print("Testing getting imports for user_id 6...")
        try:
            # Based on psql results, user_id 6 has imports
            imports = await get_all_imports(db, user_id=6)
            print(f"Found {len(imports)} imports.")
            # Verify the structure we will return in the router
            response = {"data": imports}
            print("Response structure verified.")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_import_list())
