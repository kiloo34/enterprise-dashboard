from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate, PositionResponse, OrganizationUnitResponse
from app.crud.crud_user import user as crud_user
from app.services.users import UserService

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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await crud_user.create(db, obj_in=request)


@router.get("/positions", response_model=List[PositionResponse])
async def list_positions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user_service = UserService(db)
    return await user_service.get_positions()


@router.get("/organization-units", response_model=List[OrganizationUnitResponse])
async def list_org_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    user_service = UserService(db)
    return await user_service.get_organization_units()
