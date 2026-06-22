from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Any
from datetime import datetime, timedelta
import httpx
import logging

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.models.user import User, OrganizationUnit
from app.core.config import settings
from ent_dash_common.auth import generate_service_token

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/system-stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
) -> Any:
    """Aggregated stats for the superadmin dashboard (Data from IAM + Engine)."""
    
    # 1. IAM Stats: Users
    total_users = await db.scalar(select(func.count(User.id))) or 0
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_users_count = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    ) or 0
    
    recent_users_result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(5)
    )
    recent_user_list = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in recent_users_result.scalars().all()
    ]

    # 2. IAM Stats: Organization
    total_units = await db.scalar(select(func.count(OrganizationUnit.id))) or 0

    # 3. Engine Stats: Imports (Cross-service call)
    import_stats = {
        "total": 0,
        "completed": 0,
        "failed": 0,
        "pending": 0,
        "recent_list": []
    }
    
    try:
        engine_stats_url = f"{settings.ENGINE_INTERNAL_URL}/api/imports/admin/summary"
        m2m_token = generate_service_token(settings.SECRET_KEY, settings.ALGORITHM)
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                engine_stats_url,
                headers={"Authorization": f"Bearer {m2m_token}"},
            )
            if response.status_code == 200:
                import_stats = response.json()
            else:
                logger.error(f"Engine stats call failed: {response.status_code}")
    except Exception as e:
        logger.error(f"Error calling Engine stats: {e}")

    return {
        "users": {
            "total": total_users,
            "recent_30_days": recent_users_count,
            "recent_list": recent_user_list,
        },
        "organization": {
            "total_units": total_units,
        },
        "imports": import_stats
    }
