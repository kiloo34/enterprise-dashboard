"""
Celery Worker — Internal batch processing for the Data Engine.

When a Kafka event is consumed (or as a fallback), a Celery task:
  1. Downloads the CSV file from MinIO.
  2. Parses and chunk-inserts rows into the target DB table.
  3. Updates the FileImport record with status/row counts.
  4. Publishes a `engine.data_processed` Kafka event on completion
     so other services (Analytics, Recon) can react.
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "ent_dash_engine_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.imports"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Jakarta",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,    # Process one task at a time per worker for big CSV
    task_acks_late=True,             # Only ack after task is done (safer for big jobs)
)
