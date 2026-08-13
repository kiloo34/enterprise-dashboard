from sqlalchemy import Column, String, BigInteger, JSON, DateTime
from app.db.base import Base
from datetime import datetime, timezone


class FileImport(Base):
    """
    Tracks the lifecycle of a file import job.
    Owned by the Data Engine service.

    Note: user_id is stored as a plain BigInteger — NOT a FK to the IAM service's DB.
    In a microservices world, we only store the reference ID, not a relational FK.
    """
    __tablename__ = "file_imports"
    __table_args__ = {"schema": "app"}

    id = Column(String(36), primary_key=True)
    user_id = Column(BigInteger, nullable=True)         # Reference only — no FK to IAM DB
    file_name = Column(String(255), nullable=False)
    minio_object_name = Column(String(512), nullable=True)  # NEW: path in MinIO
    file_path = Column(String(255), nullable=True)          # Kept for backward compat
    target_table = Column(String(255), nullable=False)

    total_rows = Column(BigInteger, default=0)
    processed_rows = Column(BigInteger, default=0)
    failed_rows = Column(BigInteger, default=0)
    status = Column(String(50), default="pending")          # pending | processing | completed | partial | failed | cancelled
    celery_task_id = Column(String(255), nullable=True)     # Celery task ID for revoke/tracking

    error_log = Column(JSON, nullable=True)
    kafka_published = Column(String(5), default="false")    # Track if Kafka event was published

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
