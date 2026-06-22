from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.schemas.qris import DailyAnalysisResponseDto
from app.services.qris import QrisService
from app.core.cache import get_cached_response, set_cached_response

router = APIRouter()


@router.get("/qris-analysis", response_model=DailyAnalysisResponseDto)
async def get_daily_analysis(
    date: str = Query("2026-01-02", description="Format: YYYY-MM-DD"),
    network: str = Query("QRIS Artajasa", description="Network Name"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    cache_key = f"qris_analysis:{network}:{date}"
    cached = await get_cached_response(cache_key)
    if cached:
        return cached

    response = await QrisService(db).get_daily_analysis(date, network)
    # We must convert pydantic model to dict if it isn't already, but since response_model is used,
    # the endpoint normally returns the object or dict.
    # We'll just cache the dumped dict.
    await set_cached_response(cache_key, response.model_dump() if hasattr(response, "model_dump") else response, expire=60)
    return response
