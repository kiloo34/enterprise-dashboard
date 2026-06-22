from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.schemas.financial import FinancialDashboardResponseDto
from app.services import financial as financial_service

router = APIRouter()


@router.get("/financial", response_model=FinancialDashboardResponseDto)
async def get_financial_dashboard(
    category: Optional[str] = Query(None, description="Category: DPK, KREDIT, RATIO"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    metrics, dates = await financial_service.get_financial_dashboard(db, category)
    return {"metrics": metrics, "dates": dates}
