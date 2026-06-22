from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Any, List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    target_type: str
    target_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    details: Optional[dict] = None
    payload: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogCreate(BaseModel):
    action: str
    target_type: str
    target_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    method: Optional[str] = None
    status_code: Optional[int] = None
    details: Optional[dict] = None
    payload: Optional[dict] = None

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Retrieve forensic audit logs for compliance tracking.
    """
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/audit-logs/activity")
async def log_activity(
    activity: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Log a forensic activity event (e.g. DATA_EXPORT, PAGE_VIEW) from other services or frontend.
    """
    audit_log = AuditLog(
        user_id=current_user.id,
        **activity.model_dump()
    )
    db.add(audit_log)
    await db.commit()
    return {"status": "ok"}
