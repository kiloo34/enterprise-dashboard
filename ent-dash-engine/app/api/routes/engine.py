from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Dict

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.services.engine_monitoring import get_dynamic_engine_data, get_engine_logs, get_engine_stats

router = APIRouter()

@router.get("/dynamic-data", response_model=List[Dict[str, Any]])
async def get_dynamic_engine_data_route(
    table_name: str = Query(..., description="Name of the engine table to query"),
    limit: int = Query(100, description="Max number of records to return"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    """Fetch raw data from dynamically specified engine tables."""
    try:
        return await get_dynamic_engine_data(db, table_name, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/monitor/logs", response_model=List[Dict[str, Any]])
async def get_engine_logs_route(
    limit: int = Query(100),
    engine_name: str = Query("ALL", alias="engineName"),
    log_level: str = Query("ALL", alias="logLevel"),
    module: str = Query("ALL"),
    search_query: str = Query("", alias="searchQuery"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    """Fetch unified and formatted engine logs for frontend monitoring."""
    try:
        return await get_engine_logs(db, limit, engine_name, log_level, module, search_query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitor/stats", response_model=Dict[str, Any])
async def get_engine_stats_route(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    """
    Return aggregated engine processing statistics.
    In the full microservices setup, this reads from ent_dash_engine DB.
    """
    try:
        return await get_engine_stats(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



