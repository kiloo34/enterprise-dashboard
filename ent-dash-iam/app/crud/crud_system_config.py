"""CRUD operations for SystemConfig."""
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ent_dash_common.crud import CRUDBase
from app.models.system_config import SystemConfig
from app.schemas.system_config import SystemConfigCreate, SystemConfigUpdate


class CRUDSystemConfig(CRUDBase[SystemConfig, SystemConfigCreate, SystemConfigUpdate]):

    async def get_by_key(self, db: AsyncSession, *, key: str) -> Optional[SystemConfig]:
        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession) -> List[SystemConfig]:
        result = await db.execute(select(SystemConfig).order_by(SystemConfig.key))
        return result.scalars().all()

    async def get_all_as_dict(self, db: AsyncSession) -> Dict[str, str]:
        """Returns {key: value} dict — used by ConfigService cache loader."""
        configs = await self.get_all(db)
        return {c.key: c.value for c in configs}

    async def upsert(
        self,
        db: AsyncSession,
        *,
        key: str,
        value: str,
        updated_by: Optional[str] = None,
    ) -> SystemConfig:
        """Update value if key exists, otherwise do nothing (seed data is the source of truth for new keys)."""
        obj = await self.get_by_key(db, key=key)
        if obj:
            obj.value = value
            if updated_by:
                obj.updated_by = updated_by
            db.add(obj)
            await db.commit()
            await db.refresh(obj)
        return obj

    async def bulk_update(
        self,
        db: AsyncSession,
        *,
        items: List[Dict[str, str]],
        updated_by: Optional[str] = None,
    ) -> List[SystemConfig]:
        updated = []
        for item in items:
            obj = await self.get_by_key(db, key=item["key"])
            if obj and obj.is_editable:
                obj.value = item["value"]
                if updated_by:
                    obj.updated_by = updated_by
                db.add(obj)
                updated.append(obj)
        await db.commit()
        for obj in updated:
            await db.refresh(obj)
        return updated


system_config = CRUDSystemConfig(SystemConfig)
