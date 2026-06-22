from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Optional

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.schemas.financial import FinancialDashboardResponseDto
from app.services.financial import FinancialService
from app.core.cache import get_cached_response, set_cached_response

router = APIRouter()


@router.get("/financial", response_model=FinancialDashboardResponseDto)
async def get_financial_dashboard(
    category: Optional[str] = Query(None, description="Category: DPK, KREDIT, RATIO"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    cache_key = f"financial_dashboard:{category}"
    cached = await get_cached_response(cache_key)
    if cached:
        return cached

    metrics, dates = await FinancialService(db).get_financial_dashboard(category)
    response = {"metrics": metrics, "dates": dates}
    await set_cached_response(cache_key, response, expire=60)
    return response
