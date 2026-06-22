"""
MinIO Client — Object Storage for large file uploads.

Files uploaded by users are stored in MinIO (S3-compatible) instead of the
local filesystem. This enables:
  1. Decoupled storage from the container runtime.
  2. Sharing uploaded files between multiple containers/workers safely.
  3. Storing files that survive container restarts/redeployments.
"""
import io
import logging
from minio import Minio
from minio.error import S3Error
from app.core.config import settings

logger = logging.getLogger(__name__)

_minio_client: Minio | None = None


def get_minio_client() -> Minio:
    global _minio_client
    if _minio_client is None:
        _minio_client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL,
        )
        # Ensure the bucket exists
        try:
            if not _minio_client.bucket_exists(settings.MINIO_BUCKET):
                _minio_client.make_bucket(settings.MINIO_BUCKET)
                logger.info(f"Created MinIO bucket: {settings.MINIO_BUCKET}")
        except S3Error as e:
            logger.error(f"MinIO bucket init error: {e}")
    return _minio_client


def upload_file_to_minio(object_name: str, data: bytes, content_type: str = "text/csv") -> str:
    """
    Uploads raw bytes to MinIO and returns the object path (not a pre-signed URL).
    Returns: the object_name stored (used later to download by the worker).
    """
    client = get_minio_client()
    data_stream = io.BytesIO(data)
    client.put_object(
        settings.MINIO_BUCKET,
        object_name,
        data_stream,
        length=len(data),
        content_type=content_type,
    )
    logger.info(f"Uploaded {object_name} ({len(data)} bytes) to MinIO bucket '{settings.MINIO_BUCKET}'")
    return object_name


def get_minio_presigned_url(object_name: str, expires_hours: int = 1) -> str:
    """Generate a pre-signed download URL valid for `expires_hours` hours."""
    from datetime import timedelta
    client = get_minio_client()
    return client.presigned_get_object(
        settings.MINIO_BUCKET,
        object_name,
        expires=timedelta(hours=expires_hours),
    )
