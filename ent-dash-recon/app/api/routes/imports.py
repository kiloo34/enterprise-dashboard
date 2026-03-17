from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Any, List
from datetime import datetime, timezone

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.imports import FileImportResponse, FileImportCreateResponse
from app.services import imports as import_service

router = APIRouter()

@router.get("", response_model=List[FileImportResponse])
async def list_imports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await import_service.get_all_imports(db, current_user.id)

@router.post("/upload", response_model=FileImportCreateResponse)
async def upload_file(
    file: UploadFile = File(...),
    target_table: str = Form("rekon.rekon_qris_aj"),
    priority: int = Form(0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # ── Validate file extension ──────────────────────────────────────────────
    allowed_extensions = {".csv", ".txt"}
    file_ext = ""
    if file.filename and "." in file.filename:
        file_ext = "." + file.filename.rsplit(".", 1)[-1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": (
                    f"Format file '{file_ext or 'tidak diketahui'}' tidak didukung. "
                    f"Hanya file .csv dan .txt yang diperbolehkan."
                ),
            },
        )
    # ────────────────────────────────────────────────────────────────────────

    try:
        file_import = await import_service.process_upload(db, file, target_table, priority, current_user.id)
    except Exception as e:
        import traceback
        print(f"CRITICAL upload error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": "UPLOAD_FAILED", "message": f"Gagal memproses file: {str(e)}"}
        )

    return FileImportCreateResponse(
        id=file_import.id,
        status="success",
        message="File uploaded successfully. Background processing started.",
        import_id=str(file_import.id),
        file_name=file_import.file_name,
        progress=100
    )

@router.get("/{id}", response_model=FileImportResponse)
async def get_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    file_import = await import_service.get_import_by_id(db, id)
    if not file_import:
        raise HTTPException(status_code=404, detail={"code": "IMPORT_NOT_FOUND", "message": "Import not found"})
    return file_import

@router.post("/{id}/retry", response_model=FileImportCreateResponse)
async def retry_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Retry a failed or stuck import."""
    file_import = await import_service.get_import_by_id(db, id)
    if not file_import:
        raise HTTPException(status_code=404, detail={"code": "IMPORT_NOT_FOUND", "message": "Import not found"})

    if file_import.status not in ("failed", "processing", "partial"):
        raise HTTPException(
            status_code=400,
            detail={"code": "CANNOT_RETRY", "message": f"Hanya import berstatus failed/partial/processing yang bisa di-retry. Status saat ini: {file_import.status}"}
        )

    import os
    if not os.path.exists(file_import.file_path):
        raise HTTPException(
            status_code=400,
            detail={"code": "FILE_NOT_FOUND", "message": "File upload tidak ditemukan di server. Silakan upload ulang file."}
        )

    # Reset status to pending
    await db.execute(
        text("UPDATE app.file_imports SET status='pending', processed_rows=0, failed_rows=0, error_log=NULL, updated_at=now() WHERE id=:id"),
        {"id": id}
    )
    await db.commit()

    # Re-dispatch Celery task
    try:
        from app.tasks.imports import process_csv_import
        process_csv_import.apply_async(
            args=[str(file_import.id), file_import.file_path, file_import.target_table],
            priority=file_import.priority or 0,
        )
    except Exception as e:
        print(f"Failed to re-dispatch Celery task for retry: {e}")

    return FileImportCreateResponse(
        id=file_import.id,
        status="pending",
        message="Import akan diproses ulang di background.",
        import_id=str(file_import.id),
        file_name=file_import.file_name,
        progress=0
    )

@router.post("/{id}/cancel", status_code=200)
async def cancel_import(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Stop a processing or pending import."""
    file_import = await import_service.get_import_by_id(db, id)
    if not file_import:
        raise HTTPException(status_code=404, detail={"code": "IMPORT_NOT_FOUND", "message": "Import not found"})

    if file_import.status not in ("processing", "pending"):
        raise HTTPException(
            status_code=400,
            detail={"code": "CANNOT_CANCEL", "message": f"Hanya import berstatus processing atau pending yang bisa di-cancel. Status saat ini: {file_import.status}"}
        )

    await db.execute(
        text("UPDATE app.file_imports SET status='cancelled', updated_at=now() WHERE id=:id"),
        {"id": id}
    )
    await db.commit()
    return {"status": "cancelled", "message": "Import telah dihentikan."}

@router.post("/reset-stuck", status_code=200)
async def reset_stuck_imports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Reset all imports that have been stuck in PROCESSING for more than 10 minutes."""
    result = await db.execute(
        text("""
            UPDATE app.file_imports
            SET status='failed',
                error_log='{"message": "Import dihentikan karena tidak ada aktivitas selama lebih dari 10 menit (stuck).", "reset_at": "now"}'
            WHERE status = 'processing'
              AND updated_at < (NOW() - INTERVAL '10 minutes')
            RETURNING id
        """)
    )
    await db.commit()
    reset_ids = [str(row[0]) for row in result.fetchall()]
    return {"reset_count": len(reset_ids), "reset_ids": reset_ids, "message": f"{len(reset_ids)} import stuck berhasil di-reset."}
