from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.role_permission import Role, Permission, RoleHasPermission
from app.schemas.rbac import RoleResponse, RoleCreate, RoleUpdate, PermissionResponse, PermissionBase

router = APIRouter()

# --- Permissions ---

@router.get("/permissions", response_model=List[PermissionResponse])
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all permissions"""
    result = await db.execute(select(Permission))
    return result.scalars().all()

@router.post("/permissions", response_model=PermissionResponse)
async def create_permission(
    permission_in: PermissionBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new permission"""
    new_perm = Permission(name=permission_in.name, guard_name=permission_in.guard_name)
    db.add(new_perm)
    await db.commit()
    await db.refresh(new_perm)
    return new_perm

@router.put("/permissions/{permission_id}", response_model=PermissionResponse)
async def update_permission(
    permission_id: int,
    permission_in: PermissionBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update a permission"""
    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = result.scalar_one_or_none()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    permission.name = permission_in.name
    permission.guard_name = permission_in.guard_name
    
    await db.commit()
    await db.refresh(permission)
    return permission

@router.delete("/permissions/{permission_id}")
async def delete_permission(
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a permission"""
    result = await db.execute(select(Permission).where(Permission.id == permission_id))
    permission = result.scalar_one_or_none()
    if not permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    await db.delete(permission)
    await db.commit()
    return {"status": "success", "message": "Permission deleted"}


# --- Roles ---

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get all roles with their permissions"""
    result = await db.execute(select(Role).options(selectinload(Role.permissions)))
    return result.scalars().all()

@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Create a new role and map permissions"""
    new_role = Role(name=role_in.name, guard_name=role_in.guard_name)
    db.add(new_role)
    await db.flush() # Get the ID before commit
    
    # Map permissions
    if role_in.permissions:
        for p_id in role_in.permissions:
            mapping = RoleHasPermission(role_id=new_role.id, permission_id=p_id)
            db.add(mapping)
    
    await db.commit()
    # Fetch again with permissions
    result = await db.execute(select(Role).where(Role.id == new_role.id).options(selectinload(Role.permissions)))
    return result.scalar_one()

@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Update a role and its permission mapping"""
    result = await db.execute(select(Role).where(Role.id == role_id).options(selectinload(Role.permissions)))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role_in.name:
        role.name = role_in.name
    if role_in.guard_name:
        role.guard_name = role_in.guard_name
        
    # Update permissions
    if role_in.permissions is not None:
        # Delete old mappings
        await db.execute(delete(RoleHasPermission).where(RoleHasPermission.role_id == role_id))
        # Add new mappings
        for p_id in role_in.permissions:
            mapping = RoleHasPermission(role_id=role_id, permission_id=p_id)
            db.add(mapping)
            
    await db.commit()
    # Fetch again with permissions
    result = await db.execute(select(Role).where(Role.id == role_id).options(selectinload(Role.permissions)))
    return result.scalar_one()

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Delete a role"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Protective check
    if role.name.lower() in ['super-admin', 'administrator', 'superadmin']:
        raise HTTPException(status_code=400, detail="Cannot delete system administrator role")
        
    await db.delete(role)
    await db.commit()
    return {"status": "success", "message": "Role deleted"}
