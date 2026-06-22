from fastapi import APIRouter, Depends
from app.core.exceptions import NotFoundException, AppException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.rbac import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse, PermissionBase
from app.crud.crud_role import role as crud_role
from app.crud.crud_permission import permission as crud_permission

router = APIRouter()


# --- Permissions ---

@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_permission.get_multi(db)


@router.post("/permissions", response_model=PermissionResponse)
async def create_permission(
    permission_in: PermissionBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_permission.create(db, obj_in=permission_in)


@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_in: PermissionBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    permission = await crud_permission.get(db, id=permission_id)
    if not permission:
        raise NotFoundException(message="Permission not found", code="PERMISSION_NOT_FOUND")
    return await crud_permission.update(db, db_obj=permission, obj_in=permission_in)


@router.delete("/permissions/{permission_id}")
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    permission = await crud_permission.get(db, id=permission_id)
    if not permission:
        raise NotFoundException(message="Permission not found", code="PERMISSION_NOT_FOUND")
    await crud_permission.remove(db, id=permission_id)
    return {"status": "success", "message": "Permission deleted"}


# --- Roles ---

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_role.get_multi_with_permissions(db)


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_role.create(db, obj_in=role_in)


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = await crud_role.get_with_permissions(db, id=role_id)
    if not role:
        raise NotFoundException(message="Role not found", code="ROLE_NOT_FOUND")
    return await crud_role.update(db, db_obj=role, obj_in=role_in)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = await crud_role.get(db, id=role_id)
    if not role:
        raise NotFoundException(message="Role not found", code="ROLE_NOT_FOUND")

    if role.name.lower() in ["super-admin", "administrator", "superadmin"]:
        raise AppException(message="Cannot delete system administrator role", code="DELETE_PROTECTED_ROLE")

    await crud_role.remove(db, id=role_id)
    return {"status": "success", "message": "Role deleted"}

