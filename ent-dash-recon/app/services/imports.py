from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile
import aiofiles
import uuid
import os
from typing import List

from app.models.imports import FileImport

UPLOAD_DIR = "storage/app/imports"

async def get_all_imports(db: AsyncSession, user_id: int) -> List[FileImport]:
    result = await db.execute(select(FileImport).where(FileImport.user_id == user_id).order_by(FileImport.created_at.desc()))
    return result.scalars().all()

async def get_import_by_id(db: AsyncSession, import_id: str) -> FileImport:
    result = await db.execute(select(FileImport).where(FileImport.id == import_id))
    return result.scalars().first()

async def process_upload(db: AsyncSession, file: UploadFile, target_table: str, user_id: int) -> FileImport:
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split('.')[-1]
    # Keep original name for reference
    safe_filename = f"{file_id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    new_import = FileImport(
        id=file_id,
        user_id=user_id,
        file_name=file.filename,
        file_path=file_path,
        target_table=target_table,
        status="pending",
    )
    
    db.add(new_import)
    await db.commit()
    await db.refresh(new_import)
    
    # Dispatch Celery background task
    try:
        from app.tasks.imports import process_csv_import
        process_csv_import.delay(str(new_import.id), file_path, target_table)
    except Exception:
        # If Celery is not available (dev mode), just mark as pending
        pass
    
    return new_import

