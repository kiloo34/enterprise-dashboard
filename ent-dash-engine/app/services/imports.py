"""
Import Service — Big Data Upload Flow with MinIO + Kafka.

New flow (microservices):
  OLD: upload → save to local disk → Celery task reads from disk
  NEW: upload → save to MinIO (S3) → publish Kafka event → Celery worker
       downloads from MinIO and processes in parallel chunks

This decoupling means:
  - The API response is instant (no sync CSV parsing)
  - The worker can be scaled horizontally
  - Files survive container restarts
  - Other services (Recon, Analytics) can also consume the Kafka event
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, update
from typing import List
import uuid
import logging
from datetime import datetime, timedelta
from fastapi import UploadFile
import magic

from app.models.imports import FileImport
from app.core.storage import upload_file_to_minio
from ent_dash_common.kafka import publish_event
from app.core.config import settings
from app.crud.crud_import import file_import as crud_import, FileImportCreate, FileImportUpdate

logger = logging.getLogger(__name__)


MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

ALLOWED_MIME_TYPES = frozenset({
    "text/csv",
    "text/plain",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
})


class ImportService:
    """
    Handles complex import/upload business logic.
    Receives the DB session via constructor injection (OOP standard).
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_stats_summary(self) -> dict:
        """Get aggregated stats for file imports via repository."""
        return await crud_import.get_stats_summary(self.db)

    async def get_all_by_user(self, user_id: int) -> List[FileImport]:
        """Get all imports for a specific user via repository."""
        return await crud_import.get_multi_by_user(self.db, user_id=user_id)

    async def get_by_id(self, import_id: str) -> FileImport | None:
        """Get import record by ID via repository."""
        return await crud_import.get(self.db, id=import_id)

    async def cancel_import(self, import_id: str) -> FileImport:
        """
        Cancel a pending or processing import.
        Revokes the Celery task (if still running) and marks the record as cancelled.
        Raises ValueError if the import cannot be cancelled.
        """
        record = await crud_import.get(self.db, id=import_id)
        if not record:
            raise ValueError(f"Import {import_id} not found.")

        if record.status in ("completed", "cancelled", "failed"):
            raise ValueError(
                f"Import '{import_id}' is already '{record.status}' and cannot be cancelled."
            )

        # Revoke Celery task if we have a task ID
        if record.celery_task_id:
            try:
                from app.worker import celery_app
                celery_app.control.revoke(
                    record.celery_task_id,
                    terminate=True,
                    signal="SIGTERM",
                )
                logger.info(f"[ImportService] Revoked Celery task {record.celery_task_id} for import {import_id}")
            except Exception as e:
                logger.warning(f"[ImportService] Could not revoke task {record.celery_task_id}: {e}")

        updated = await crud_import.update(
            self.db,
            db_obj=record,
            obj_in=FileImportUpdate(status="cancelled"),
        )
        return updated

    async def retry_import(self, import_id: str) -> FileImport:
        """
        Retry a failed or partial import by re-queuing the Celery task.
        Raises ValueError if the import is not in a retriable state.
        """
        record = await crud_import.get(self.db, id=import_id)
        if not record:
            raise ValueError(f"Import {import_id} not found.")

        if record.status not in ("failed", "partial"):
            raise ValueError(
                f"Import '{import_id}' has status '{record.status}'. "
                "Only 'failed' or 'partial' imports can be retried."
            )

        if not record.minio_object_name:
            raise ValueError(
                f"Import '{import_id}' has no MinIO object — the file is no longer available for retry."
            )

        # Reset the record before re-queuing
        await crud_import.update(
            self.db,
            db_obj=record,
            obj_in=FileImportUpdate(
                status="pending",
                error_log=None,
                celery_task_id=None,
                processed_rows=0,
                failed_rows=0,
            ),
        )

        # Dispatch new Celery task
        from app.tasks.imports import process_csv_import
        task = process_csv_import.delay(import_id, record.minio_object_name, record.target_table)
        logger.info(f"[ImportService] Re-queued import {import_id} as Celery task {task.id}")

        # Refresh and return the updated record
        return await crud_import.get(self.db, id=import_id)

    async def reset_stuck_imports(self, threshold_minutes: int = 120) -> int:
        """
        Reset imports stuck in 'processing' status for longer than threshold_minutes.
        Returns the number of records that were reset.
        """
        cutoff = datetime.utcnow() - timedelta(minutes=threshold_minutes)
        result = await self.db.execute(
            select(FileImport).where(
                FileImport.status == "processing",
                FileImport.updated_at < cutoff,
            )
        )
        stuck = result.scalars().all()

        if not stuck:
            return 0

        for record in stuck:
            record.status = "failed"
            record.error_log = {
                "message": f"Reset: stuck in 'processing' for more than {threshold_minutes} minutes.",
                "reset_at": datetime.utcnow().isoformat(),
            }
            self.db.add(record)

        await self.db.commit()
        logger.info(f"[ImportService] Reset {len(stuck)} stuck import(s) (threshold: {threshold_minutes}m)")
        return len(stuck)

    async def process_upload(
        self,
        file: UploadFile,
        target_table: str,
        user_id: int,
    ) -> FileImport:
        """
        Handles the complex upload flow:
        1. Read bytes → 2. Upload to MinIO → 3. Save DB record via CRUD → 4. Publish Kafka Event
        """
        file_id = str(uuid.uuid4())
        file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "csv"
        object_name = f"imports/{datetime.utcnow().strftime('%Y/%m/%d')}/{file_id}.{file_ext}"

        # Step 1: Read file bytes with size guard (reads MAX+1 to detect oversize)
        content = await file.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise ValueError(
                f"File terlalu besar. Batas maksimal {MAX_FILE_SIZE // (1024 * 1024)} MB."
            )
        file_size = len(content)
        logger.info(f"Received upload: {file.filename} ({file_size} bytes) for table {target_table}")

        # Validate MIME type from magic bytes (server-side, not trusting client header)
        detected_mime = magic.from_buffer(content[:2048], mime=True)
        if detected_mime not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Tipe file tidak diizinkan: {detected_mime}. "
                f"Harap unggah file CSV atau Excel."
            )

        # Step 2: Upload to MinIO
        minio_object_name = None
        try:
            content_type = detected_mime
            minio_object_name = upload_file_to_minio(object_name, content, content_type)
        except Exception as e:
            logger.error(f"MinIO upload failed for {file.filename}: {e}")
            minio_object_name = None

        # Step 3: Create DB record via Repository
        new_import_data = FileImportCreate(
            id=file_id,
            user_id=user_id,
            file_name=file.filename,
            minio_object_name=minio_object_name,
            file_path=object_name,
            target_table=target_table,
            status="pending",
        )
        new_import = await crud_import.create(self.db, obj_in=new_import_data)

        # Step 4: Publish Kafka event
        event_payload = {
            "import_id": file_id,
            "object_name": minio_object_name or object_name,
            "target_table": target_table,
            "user_id": user_id,
            "file_name": file.filename,
            "file_size_bytes": file_size,
            "uploaded_at": datetime.utcnow().isoformat(),
        }
        publish_event(
            bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
            topic=settings.KAFKA_TOPIC_FILE_UPLOADED,
            payload=event_payload,
            key=file_id,
            client_id="ent-dash-engine",
        )

        # Update kafka status via Repository
        await crud_import.update(self.db, db_obj=new_import, obj_in={"kafka_published": "true"})

        # Dispatch Celery task directly — no Kafka consumer needed on this service
        from app.tasks.imports import process_csv_import
        process_csv_import.delay(file_id, minio_object_name or object_name, target_table)

        logger.info(
            f"Import {file_id} created, Kafka event published, and Celery task dispatched."
        )
        return new_import
