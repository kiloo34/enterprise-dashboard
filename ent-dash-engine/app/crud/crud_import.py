from typing import List, Optional, Any, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud.base import CRUDBase
from app.models.imports import FileImport
from pydantic import BaseModel


class FileImportCreate(BaseModel):
    id: str
    user_id: Optional[int]
    file_name: str
    minio_object_name: Optional[str]
    file_path: Optional[str]
    target_table: str
    status: str = "pending"


class FileImportUpdate(BaseModel):
    status: Optional[str] = None
    total_rows: Optional[int] = None
    processed_rows: Optional[int] = None
    failed_rows: Optional[int] = None
    error_log: Optional[Dict[str, Any]] = None
    kafka_published: Optional[str] = None
    celery_task_id: Optional[str] = None


class CRUDFileImport(CRUDBase[FileImport, FileImportCreate, FileImportUpdate]):
    async def get_stats_summary(self, db: AsyncSession) -> dict:
        total = await db.scalar(select(func.count(FileImport.id))) or 0
        completed = await db.scalar(select(func.count(FileImport.id)).where(FileImport.status == "completed")) or 0
        failed = await db.scalar(select(func.count(FileImport.id)).where(FileImport.status == "failed")) or 0
        pending = await db.scalar(select(func.count(FileImport.id)).where(FileImport.status.in_(["pending", "processing"]))) or 0

        recent_result = await db.execute(
            select(FileImport).order_by(FileImport.created_at.desc()).limit(5)
        )
        recent_list = []
        for r in recent_result.scalars().all():
            recent_list.append({
                "id": r.id,
                "file_name": r.file_name,
                "target_table": r.target_table,
                "status": r.status.upper() if r.status else "PENDING",
                "total_rows": r.total_rows,
                "processed_rows": r.processed_rows,
                "failed_rows": r.failed_rows,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        return {
            "total": total,
            "completed": completed,
            "failed": failed,
            "pending": pending,
            "recent_list": recent_list,
        }

    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[FileImport]:
        query = (
            select(FileImport)
            .where(FileImport.user_id == user_id)
            .order_by(FileImport.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        result = await db.execute(query)
        return result.scalars().all()


file_import = CRUDFileImport(FileImport)
