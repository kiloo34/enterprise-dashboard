from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.schemas.qris import DailyAnalysisResponseDto
from app.services import qris as qris_service

router = APIRouter()


@router.get("/qris-analysis", response_model=DailyAnalysisResponseDto)
async def get_daily_analysis(
    date: str = Query("2026-01-02", description="Format: YYYY-MM-DD"),
    network: str = Query("QRIS Artajasa", description="Network Name"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    return await qris_service.get_daily_analysis(db, date, network)
