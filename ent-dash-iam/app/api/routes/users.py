from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.crud.crud_user import user as crud_user

router = APIRouter()


@router.get("", response_model=UserResponse)
async def read_current_user(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get current authenticated user."""
    return current_user


@router.put("/settings", response_model=UserResponse)
async def update_settings(
    request: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update current user UI settings."""
    return await crud_user.update(db, db_obj=current_user, obj_in=request)

