from typing import List, Optional, Union, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.role_permission import Role, RoleHasPermission
from app.schemas.rbac import RoleCreate, RoleUpdate


class CRUDRole(CRUDBase[Role, RoleCreate, RoleUpdate]):
    async def get_with_permissions(self, db: AsyncSession, *, id: int) -> Optional[Role]:
        query = select(Role).filter(Role.id == id).options(selectinload(Role.permissions))
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def get_multi_with_permissions(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[Role]:
        query = select(Role).options(selectinload(Role.permissions)).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def create(self, db: AsyncSession, *, obj_in: RoleCreate) -> Role:
        db_obj = Role(name=obj_in.name, guard_name=obj_in.guard_name)
        db.add(db_obj)
        await db.flush()

        if obj_in.permissions:
            for p_id in obj_in.permissions:
                mapping = RoleHasPermission(role_id=db_obj.id, permission_id=p_id)
                db.add(mapping)

        await db.commit()
        await db.refresh(db_obj)
        # Reload with permissions for response
        return await self.get_with_permissions(db, id=db_obj.id)

    async def update(
        self, db: AsyncSession, *, db_obj: Role, obj_in: Union[RoleUpdate, Dict[str, Any]]
    ) -> Role:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)

        if "permissions" in update_data and update_data["permissions"] is not None:
            permissions = update_data.pop("permissions")
            await db.execute(delete(RoleHasPermission).where(RoleHasPermission.role_id == db_obj.id))
            for p_id in permissions:
                mapping = RoleHasPermission(role_id=db_obj.id, permission_id=p_id)
                db.add(mapping)

        return await super().update(db, db_obj=db_obj, obj_in=update_data)


role = CRUDRole(Role)
