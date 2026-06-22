from fastapi import APIRouter, Depends, Request
from app.core.exceptions import NotFoundException, AppException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.rbac import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse, PermissionBase
from app.crud.crud_role import role as crud_role
from app.crud.crud_permission import permission as crud_permission
from app.services.audit import AuditService

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
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    new_perm = await crud_permission.create(db, obj_in=permission_in)
    await AuditService.log_action(db, current_user.id, "PERMISSION_CREATED", "Permission", str(new_perm.id), permission_in.model_dump(), request=http_request)
    return new_perm


@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_in: PermissionBase,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    permission = await crud_permission.get(db, id=permission_id)
    if not permission:
        raise NotFoundException(message="Permission not found", code="PERMISSION_NOT_FOUND")
    updated_perm = await crud_permission.update(db, db_obj=permission, obj_in=permission_in)
    await AuditService.log_action(db, current_user.id, "PERMISSION_UPDATED", "Permission", str(permission_id), permission_in.model_dump(), request=http_request)
    return updated_perm


@router.delete("/permissions/{permission_id}")
async def delete_permission(
    permission_id: int,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    permission = await crud_permission.get(db, id=permission_id)
    if not permission:
        raise NotFoundException(message="Permission not found", code="PERMISSION_NOT_FOUND")
    await crud_permission.remove(db, id=permission_id)
    await AuditService.log_action(db, current_user.id, "PERMISSION_DELETED", "Permission", str(permission_id), request=http_request)
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
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    new_role = await crud_role.create(db, obj_in=role_in)
    await AuditService.log_action(db, current_user.id, "ROLE_CREATED", "Role", str(new_role.id), role_in.model_dump(), request=http_request)
    return new_role


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = await crud_role.get_with_permissions(db, id=role_id)
    if not role:
        raise NotFoundException(message="Role not found", code="ROLE_NOT_FOUND")
    updated_role = await crud_role.update(db, db_obj=role, obj_in=role_in)
    await AuditService.log_action(db, current_user.id, "ROLE_UPDATED", "Role", str(role_id), role_in.model_dump(), request=http_request)
    return updated_role


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    role = await crud_role.get(db, id=role_id)
    if not role:
        raise NotFoundException(message="Role not found", code="ROLE_NOT_FOUND")

    if role.name.lower() in ["super-admin", "administrator", "superadmin"]:
        raise AppException(message="Cannot delete system administrator role", code="DELETE_PROTECTED_ROLE")

    await crud_role.remove(db, id=role_id)
    await AuditService.log_action(db, current_user.id, "ROLE_DELETED", "Role", str(role_id), request=http_request)
    return {"status": "success", "message": "Role deleted"}

