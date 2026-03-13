import csv
import io
import asyncio
from datetime import datetime

from app.worker import celery_app
from app.db.session import AsyncSessionLocal
from sqlalchemy import text


# ─── Delimiter Auto-Detection ─────────────────────────────────────────────────
SUPPORTED_DELIMITERS = [";", ",", "\t", "|"]

def _detect_delimiter(sample: str) -> str | None:
    """
    Try each supported delimiter and return the one that produces
    the most consistent column count across rows.
    Returns None if no valid CSV structure is found.
    """
    best_delimiter = None
    best_score = 0

    for delim in SUPPORTED_DELIMITERS:
        try:
            reader = csv.reader(io.StringIO(sample), delimiter=delim)
            rows = list(reader)
            if len(rows) < 2:
                continue

            col_counts = [len(r) for r in rows]
            header_cols = col_counts[0]

            if header_cols < 2:
                continue

            # Score: how many rows match the header col count (consistency)
            consistent = sum(1 for c in col_counts if c == header_cols)
            score = consistent * header_cols

            if score > best_score:
                best_score = score
                best_delimiter = delim
        except Exception:
            continue

    return best_delimiter


def _validate_csv_structure(sample: str, delimiter: str) -> tuple[bool, str]:
    """
    Validate that the file has a proper CSV structure.
    Returns (is_valid, error_message).
    """
    try:
        reader = csv.reader(io.StringIO(sample), delimiter=delimiter)
        rows = list(reader)

        if not rows:
            return False, "File kosong atau tidak dapat dibaca."

        header = rows[0]
        if len(header) < 2:
            return False, (
                f"Format dokumen tidak valid sebagai CSV. "
                f"Header hanya memiliki {len(header)} kolom. "
                f"Minimum 2 kolom diperlukan. "
                f"Pastikan file menggunakan delimiter yang benar (;, koma, atau tab)."
            )

        data_rows = rows[1:]
        if len(data_rows) == 0:
            return False, "File tidak memiliki data (hanya header)."

        # Check consistency: at least 70% of rows must match header col count
        expected_cols = len(header)
        matching = sum(1 for r in data_rows if len(r) == expected_cols)
        consistency = matching / len(data_rows)

        if consistency < 0.7:
            return False, (
                f"Struktur CSV tidak konsisten. Header memiliki {expected_cols} kolom, "
                f"tapi mayoritas baris data tidak sesuai. "
                f"Dokumen mungkin bukan format CSV yang valid."
            )

        return True, ""

    except Exception as e:
        return False, f"Gagal memvalidasi struktur file: {str(e)}"


@celery_app.task(bind=True, name="tasks.process_csv_import", max_retries=3)
def process_csv_import(self, import_id: str, file_path: str, target_table: str):
    """
    Background task to process a CSV/TXT file and bulk-insert into target_table.
    Supports auto-detection of delimiters (;, comma, tab, pipe).
    Rejects files that are not structured as valid CSV.
    """
    asyncio.run(_process_csv(import_id, file_path, target_table))


async def _process_csv(import_id: str, file_path: str, target_table: str):
    async with AsyncSessionLocal() as db:
        # Mark as processing
        await db.execute(
            text("UPDATE app.file_imports SET status='processing' WHERE id=:id"),
            {"id": import_id}
        )
        await db.commit()

        try:
            # Read a sample to detect delimiter and validate structure
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                sample = f.read(8192)  # Read first 8KB for detection

            if not sample.strip():
                raise ValueError("File kosong atau tidak dapat dibaca.")

            # Auto-detect delimiter
            delimiter = _detect_delimiter(sample)
            if delimiter is None:
                raise ValueError(
                    "Dokumen bukan format CSV yang valid. "
                    "Tidak ditemukan pola kolom yang konsisten. "
                    "Pastikan file menggunakan pemisah: titik koma (;), koma (,), atau tab."
                )

            # Validate CSV structure
            is_valid, err_msg = _validate_csv_structure(sample, delimiter)
            if not is_valid:
                raise ValueError(err_msg)

            # Process the file
            CHUNK_SIZE = 500
            rows = []
            total_rows = 0
            processed_rows = 0
            failed_rows = 0

            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.DictReader(f, delimiter=delimiter)
                headers = [h.strip().lower() for h in (reader.fieldnames or [])]
                reader.fieldnames = headers

                for row in reader:
                    total_rows += 1
                    normalized = {k.strip().lower(): (v.strip() if v else None) for k, v in row.items()}
                    rows.append(normalized)

                    if len(rows) >= CHUNK_SIZE:
                        ok, fail = await _bulk_insert(db, target_table, rows)
                        processed_rows += ok
                        failed_rows += fail
                        rows = []

                if rows:
                    ok, fail = await _bulk_insert(db, target_table, rows)
                    processed_rows += ok
                    failed_rows += fail

            final_status = "completed" if failed_rows == 0 else "partial"
            await db.execute(
                text("""
                    UPDATE app.file_imports
                    SET status=:status, total_rows=:total, processed_rows=:proc, failed_rows=:fail
                    WHERE id=:id
                """),
                {"status": final_status, "total": total_rows, "proc": processed_rows, "fail": failed_rows, "id": import_id}
            )
            await db.commit()

        except Exception as e:
            await db.execute(
                text("UPDATE app.file_imports SET status='failed', error_log=:err WHERE id=:id"),
                {"err": str(e), "id": import_id}
            )
            await db.commit()


async def _bulk_insert(db, target_table: str, rows: list) -> tuple[int, int]:
    """Insert a chunk of rows into target_table and return (ok, fail) counts."""
    if not rows:
        return 0, 0

    cols = list(rows[0].keys())
    col_names = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(f":{c}" for c in cols)

    try:
        await db.execute(
            text(f"INSERT INTO {target_table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"),
            rows
        )
        await db.commit()
        return len(rows), 0
    except Exception as e:
        await db.rollback()
        return 0, len(rows)
