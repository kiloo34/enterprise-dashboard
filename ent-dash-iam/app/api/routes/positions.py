from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.session import get_db
from app.api.deps import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import PositionCreate, PositionUpdate, PositionResponse
from app.services import positions as positions_service
from app.services.audit import AuditService

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
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    position_in: PositionCreate,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    new_pos = await positions_service.create_position(db=db, position_in=position_in)
    await AuditService.log_action(db, current_user.id, "POSITION_CREATED", "Position", str(new_pos.id), position_in.model_dump(), request=http_request)
    return new_pos

@router.patch("/{position_id}", response_model=PositionResponse)
async def update_position(
    *,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    position_id: int,
    position_in: PositionUpdate,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    updated_pos = await positions_service.update_position(db=db, position_id=position_id, position_in=position_in)
    await AuditService.log_action(db, current_user.id, "POSITION_UPDATED", "Position", str(position_id), position_in.model_dump(exclude_unset=True), request=http_request)
    return updated_pos

@router.delete("/{position_id}")
async def delete_position(
    *,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    position_id: int,
    current_user: User = Depends(require_permissions(["positions:write"]))
) -> Any:
    result = await positions_service.delete_position(db=db, position_id=position_id)
    await AuditService.log_action(db, current_user.id, "POSITION_DELETED", "Position", str(position_id), request=http_request)
    return result
