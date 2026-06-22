from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    UserResponse, UserCreate, UserUpdate, UserRoleAssign,
    PositionResponse, PositionCreate, PositionUpdate,
    OrganizationUnitResponse, OrganizationUnitCreate, OrganizationUnitUpdate
)
from app.crud.crud_user import user as crud_user
from app.services.users import UserService
from app.services.audit import AuditService

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_user.get_multi_with_relations(db)


@router.post("/users", response_model=UserResponse)
async def create_new_user(
    request: UserCreate,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    new_user = await crud_user.create(db, obj_in=request)
    await AuditService.log_action(db, current_user.id, "USER_CREATED", "User", str(new_user.id), request.model_dump(exclude={"password"}), request=http_request)
    return await crud_user.get_with_relations(db, user_id=new_user.id)




@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user = await crud_user.get_with_relations(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UserUpdate,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await crud_user.update(db, db_obj=user, obj_in=request)
    await AuditService.log_action(db, current_user.id, "USER_UPDATED", "User", str(user_id), request.model_dump(exclude={"password"}, exclude_unset=True), request=http_request)
    return await crud_user.get_with_relations(db, user_id=user_id)

@router.put("/users/{user_id}/roles", response_model=UserResponse)
async def assign_user_roles(
    user_id: int,
    request: UserRoleAssign,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    result = await crud_user.assign_roles(db, user_id=user_id, role_ids=request.role_ids)
    await AuditService.log_action(db, current_user.id, "USER_ROLES_ASSIGNED", "User", str(user_id), {"role_ids": request.role_ids}, request=http_request)
    return result

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user = await crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await crud_user.remove(db, id=user_id)
    await AuditService.log_action(db, current_user.id, "USER_DELETED", "User", str(user_id), request=http_request)
    return {"message": "User deleted"}


