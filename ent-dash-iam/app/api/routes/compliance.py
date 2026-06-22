from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.compliance import ComplianceService

router = APIRouter()

@router.get("/report", response_model=Dict[str, Any])
async def get_compliance_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve the ongoing UU PDP compliance monitoring report.
    Returns health score, data retention gaps, and potential data breach anomalies.
    """
    service = ComplianceService(db)
    report = await service.get_compliance_report()
    return {"status": "success", "data": report}
