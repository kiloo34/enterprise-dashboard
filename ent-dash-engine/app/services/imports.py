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
from typing import List
import uuid
import logging
from datetime import datetime
from fastapi import UploadFile

from app.models.imports import FileImport
from app.core.storage import upload_file_to_minio
from ent_dash_common.kafka import publish_event
from app.core.config import settings
from app.crud.crud_import import file_import as crud_import, FileImportCreate

logger = logging.getLogger(__name__)


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

        # Step 1: Read file bytes
        content = await file.read()
        file_size = len(content)
        logger.info(f"Received upload: {file.filename} ({file_size} bytes) for table {target_table}")

        # Step 2: Upload to MinIO
        minio_object_name = None
        try:
            content_type = file.content_type or "text/csv"
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

        logger.info(
            f"Import {file_id} created and event published to Kafka topic: {settings.KAFKA_TOPIC_FILE_UPLOADED}"
        )
        return new_import
