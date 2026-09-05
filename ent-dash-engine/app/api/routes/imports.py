from fastapi import APIRouter, Depends, UploadFile, File, Form, Query
from app.core.exceptions import NotFoundException, AppException
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List, Dict

from app.db.session import get_db
from app.api.deps import get_current_user_payload
from app.schemas.imports import FileImportResponse, FileImportCreateResponse
from app.services.imports import ImportService

router = APIRouter()


@router.get("/admin/summary")
async def get_admin_import_summary(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload),  # K1 fix: endpoint ini butuh auth (IAM M2M token atau user JWT)
) -> Any:
    """Internal: Get stats for admin aggregation. Requires valid JWT (IAM M2M or user token)."""
    import_service = ImportService(db)
    return await import_service.get_stats_summary()


@router.get("", response_model=Dict[str, List[FileImportResponse]])
async def list_imports(
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
) -> Any:
    import_service = ImportService(db)
    imports = await import_service.get_all_by_user(int(payload["sub"]))
    return {"data": imports}


@router.post("/upload", response_model=FileImportCreateResponse)
async def upload_file(
    file: UploadFile = File(...),
    target_table: str = Form("rekon.rekon_qris_aj"),
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload)
) -> Any:
    """
    Upload a CSV/data file. The file is stored in MinIO and
    a Kafka event is published for async processing by the worker.
    File size and MIME type are validated inside ImportService using magic bytes.
    """
    from app.core.exceptions import AppException
    from fastapi import status

    import_service = ImportService(db)
    try:
        file_import = await import_service.process_upload(
            file, target_table, int(payload["sub"])
        )
    except ValueError as exc:
        raise AppException(
            code="INVALID_FILE",
            message=str(exc),
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )
    return FileImportCreateResponse(
        id=file_import.id,
        status="success",
        message="File uploaded to storage. Background processing started via event queue.",
        import_id=str(file_import.id),
        file_name=file_import.file_name,
        minio_object_name=file_import.minio_object_name,
        progress=0,
    )


@router.get("/{id}", response_model=FileImportResponse)
async def get_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload)
) -> Any:
    import_service = ImportService(db)
    file_import = await import_service.get_by_id(id)
    if not file_import:
        raise NotFoundException(message="Import not found", code="IMPORT_NOT_FOUND")
    return file_import

@router.post("/{id}/cancel", response_model=Dict[str, Any])
async def cancel_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload),
) -> Any:
    """
    Cancel a pending or processing import.
    Revokes the underlying Celery task and marks the record as 'cancelled'.
    Returns 409 if the import is already completed, failed, or cancelled.
    """
    import_service = ImportService(db)
    try:
        file_import = await import_service.cancel_import(id)
    except ValueError as exc:
        raise AppException(
            code="CANCEL_NOT_ALLOWED",
            message=str(exc),
            status_code=status.HTTP_409_CONFLICT,
        )
    return {"message": "Import cancelled successfully", "import_id": id, "status": file_import.status}


@router.post("/{id}/retry", response_model=Dict[str, Any])
async def retry_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload),
) -> Any:
    """
    Retry a failed or partial import by re-queuing the Celery task.
    Returns 409 if the import is not in a retriable state.
    """
    import_service = ImportService(db)
    try:
        await import_service.retry_import(id)
    except ValueError as exc:
        raise AppException(
            code="RETRY_NOT_ALLOWED",
            message=str(exc),
            status_code=status.HTTP_409_CONFLICT,
        )
    return {"message": "Import retry queued successfully", "import_id": id}


@router.post("/reset-stuck", response_model=Dict[str, Any])
async def reset_stuck_imports(
    threshold_minutes: int = Query(120, ge=1, le=1440, description="Minutes before a processing import is considered stuck"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload),
) -> Any:
    """
    Reset imports stuck in 'processing' status for longer than threshold_minutes (default: 120 min).
    Returns the count of records that were reset to 'failed'.
    """
    import_service = ImportService(db)
    reset_count = await import_service.reset_stuck_imports(threshold_minutes=threshold_minutes)
    return {
        "message": f"Reset {reset_count} stuck import(s).",
        "reset_count": reset_count,
        "threshold_minutes": threshold_minutes,
    }
