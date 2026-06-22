from typing import Any, Dict, List, Optional, Union
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[User]:
        query = select(User).filter(User.email == email)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: UserCreate) -> User:
        db_obj = User(
            email=obj_in.email,
            password=get_password_hash(obj_in.password),
            name=obj_in.name,
            position_id=obj_in.position_id,
            organization_unit_id=obj_in.organization_unit_id,
            direct_superior_id=obj_in.direct_superior_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def update(
        self, db: AsyncSession, *, db_obj: User, obj_in: Union[UserUpdate, Dict[str, Any]]
    ) -> User:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["password"] = get_password_hash(update_data["password"])
        return await super().update(db, db_obj=db_obj, obj_in=update_data)

    async def get_multi_with_relations(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[User]:
        from app.models.role_permission import Role
        query = (
            select(User)
            .options(
                selectinload(User.position),
                selectinload(User.organization_unit),
                selectinload(User.roles).selectinload(Role.permissions),
            )
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.unique().scalars().all()

    async def get_full_profile(self, db: AsyncSession, *, user_id: int) -> Dict[str, Any]:
        from app.models.role_permission import Role, Permission, ModelHasRole, RoleHasPermission
        from app.models.user import Position, OrganizationUnit
        
        # We could use selectinload here too if we want to stick to User object, 
        # but the current route returns a specific dict structure.
        query = (
            select(User)
            .options(
                selectinload(User.position),
                selectinload(User.organization_unit),
                selectinload(User.roles).selectinload(Role.permissions),
            )
            .filter(User.id == user_id)
        )
        result = await db.execute(query)
        user_obj = result.unique().scalar_one_or_none()
        
        if not user_obj:
            return None
            
        role = user_obj.roles[0] if user_obj.roles else None
        permissions = [p.name for p in role.permissions] if role else []
        
        return {
            "name": user_obj.name,
            "email": user_obj.email,
            "role": role.name if role else None,
            "permissions": permissions,
            "unitCode": user_obj.organization_unit.pluck_code if user_obj.organization_unit else None,
            "positionName": user_obj.position.name if user_obj.position else None,
            "positionLevel": user_obj.position.level if user_obj.position else None,
            "uiSettings": user_obj.ui_settings or {},
        }


user = CRUDUser(User)

