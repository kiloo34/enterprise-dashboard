from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import UploadFile
import aiofiles
import uuid
import os
from typing import List

from app.models.imports import FileImport

UPLOAD_DIR = "/app/storage/app/imports"

async def get_all_imports(db: AsyncSession, user_id: int) -> List[FileImport]:
    result = await db.execute(select(FileImport).where(FileImport.user_id == user_id).order_by(FileImport.created_at.desc()))
    return result.scalars().all()

async def get_import_by_id(db: AsyncSession, import_id: str) -> FileImport:
    result = await db.execute(select(FileImport).where(FileImport.id == import_id))
    return result.scalars().first()

import csv
import io

SUPPORTED_DELIMITERS = [";", ",", "\t", "|"]

def detect_delimiter(sample: str) -> str | None:
    best_delimiter = None
    best_score = 0
    for delim in SUPPORTED_DELIMITERS:
        try:
            reader = csv.reader(io.StringIO(sample), delimiter=delim)
            rows = list(reader)
            if len(rows) < 1: continue
            col_counts = [len(r) for r in rows]
            header_cols = col_counts[0]
            if header_cols < 2: continue
            consistent = sum(1 for c in col_counts if c == header_cols)
            score = consistent * header_cols
            if score > best_score:
                best_score = score
                best_delimiter = delim
        except Exception: continue
    return best_delimiter

def validate_csv_structure(sample: str, delimiter: str) -> tuple[bool, str]:
    try:
        reader = csv.reader(io.StringIO(sample), delimiter=delimiter)
        rows = list(reader)
        if not rows: return False, "File kosong atau tidak dapat dibaca."
        header = rows[0]
        if len(header) < 2:
            return False, f"Format tidak valid. Header hanya memiliki {len(header)} kolom. Minimal 2 kolom diperlukan."
        if len(rows) < 2: return False, "File tidak memiliki data (hanya header)."
        return True, ""
    except Exception as e:
        return False, f"Gagal memvalidasi struktur file: {str(e)}"

async def process_upload(db: AsyncSession, file: UploadFile, target_table: str, priority: int, user_id: int) -> FileImport:
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split('.')[-1]
    safe_filename = f"{file_id}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Structural check on the first 8KB
    sample_content = b""
    async with aiofiles.open(file_path, 'wb') as out_file:
        chunk_idx = 0
        while content := await file.read(1024 * 1024):  # Read 1MB chunks
            if chunk_idx == 0:
                sample_content = content[:8192]
            await out_file.write(content)
            chunk_idx += 1
    
    # Early validation
    sample_str = sample_content.decode("utf-8", errors="replace")
    delim = detect_delimiter(sample_str)
    if not delim:
        if os.path.exists(file_path): os.remove(file_path)
        raise ValueError("Format CSV tidak dideteksi. Pastikan file menggunakan pemisah yang didukung (;, koma, atau tab).")
    
    is_valid, err_msg = validate_csv_structure(sample_str, delim)
    if not is_valid:
        if os.path.exists(file_path): os.remove(file_path)
        raise ValueError(err_msg)
        
    new_import = FileImport(
        id=file_id,
        user_id=user_id,
        file_name=file.filename,
        file_path=file_path,
        target_table=target_table,
        priority=priority,
        status="pending",
    )
    
    db.add(new_import)
    await db.commit()
    await db.refresh(new_import)
    
    try:
        from app.tasks.imports import process_csv_import
        process_csv_import.apply_async(
            args=[str(new_import.id), file_path, target_table],
            priority=priority,
        )
    except Exception as e:
        print(f"Failed to dispatch Celery task: {e}")
    
    return new_import

