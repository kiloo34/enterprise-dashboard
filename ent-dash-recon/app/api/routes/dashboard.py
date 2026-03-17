from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import QrisStatsResponseDto, DailyAnalysisResponseDto, QrisTransactionsResponseDto
from app.services import dashboard as dashboard_service

router = APIRouter()

@router.get("/aj-stats", response_model=QrisStatsResponseDto)
async def get_aj_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await dashboard_service.get_qris_stats(db)

@router.get("/onus-stats", response_model=QrisStatsResponseDto)
async def get_onus_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await dashboard_service.get_onus_stats(db)

@router.get("/rintis-stats", response_model=QrisStatsResponseDto)
async def get_rintis_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await dashboard_service.get_rintis_stats(db)

@router.get("/qris-transactions", response_model=QrisTransactionsResponseDto)
async def get_qris_transactions(
    limit: int = Query(100, description="Limit number of transactions"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    txs = await dashboard_service.get_qris_transactions(db, limit)
    return {"transactions": txs, "total": len(txs)}

@router.get("/onus-transactions", response_model=QrisTransactionsResponseDto)
async def get_onus_transactions(
    limit: int = Query(100, description="Limit number of transactions"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    txs = await dashboard_service.get_onus_transactions(db, limit)
    return {"transactions": txs, "total": len(txs)}

@router.get("/rintis-transactions", response_model=QrisTransactionsResponseDto)
async def get_rintis_transactions(
    limit: int = Query(100, description="Limit number of transactions"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    txs = await dashboard_service.get_rintis_transactions(db, limit)
    return {"transactions": txs, "total": len(txs)}

@router.get("/qris-analysis", response_model=DailyAnalysisResponseDto)
async def get_daily_analysis(
    date: str = Query('2026-01-02', description="Format: YYYY-MM-DD"),
    network: str = Query('QRIS Artajasa', description="Network Name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await dashboard_service.get_daily_analysis(db, date, network)

