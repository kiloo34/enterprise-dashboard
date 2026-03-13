from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, PositionResponse, OrganizationUnitResponse
from app.services import user_management as crud

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud.get_all_users(db)

@router.post("/users", response_model=UserResponse)
async def create_new_user(
    request: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud.create_user(db, user_in=request)

@router.get("/positions", response_model=List[PositionResponse])
async def list_positions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud.get_positions(db)

@router.get("/organization-units", response_model=List[OrganizationUnitResponse])
async def list_org_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud.get_organization_units(db)
