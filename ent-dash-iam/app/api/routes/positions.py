from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.session import get_db
from app.api.deps import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import PositionCreate, PositionUpdate, PositionResponse
from app.services import positions as positions_service

router = APIRouter()

@router.get("", response_model=List[PositionResponse])
async def read_positions(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["positions:read"]))
) -> Any:
    return await positions_service.get_positions(db, skip=skip, limit=limit)

@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED)
async def create_position(
    *,
    db: AsyncSession = Depends(get_db),
    position_in: PositionCreate,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    return await positions_service.create_position(db=db, position_in=position_in)

@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    *,
    db: AsyncSession = Depends(get_db),
    position_id: int,
    position_in: PositionUpdate,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    return await positions_service.update_position(db=db, position_id=position_id, position_in=position_in)

@router.delete("/{position_id}")
async def delete_position(
    *,
    db: AsyncSession = Depends(get_db),
    position_id: int,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    return await positions_service.delete_position(db=db, position_id=position_id)
