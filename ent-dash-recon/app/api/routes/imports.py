from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, List

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.imports import FileImportResponse, FileImportCreateResponse
from app.services import imports as import_service

router = APIRouter()

@router.get("/", response_model=List[FileImportResponse])
async def list_imports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return await import_service.get_all_imports(db, current_user.id)

@router.post("/upload", response_model=FileImportCreateResponse)
async def upload_file(
    file: UploadFile = File(...),
    target_table: str = Form("rekon.rekon_qris_aj"),
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

    file_import = await import_service.process_upload(db, file, target_table, current_user.id)
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

