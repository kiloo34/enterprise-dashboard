import csv
import asyncio

from app.worker import celery_app
from app.db.session import AsyncSessionLocal
from sqlalchemy import text


@celery_app.task(bind=True, name="tasks.process_csv_import", max_retries=3)
def process_csv_import(self, import_id: str, file_path: str, target_table: str):
    """
    Background task to process a CSV file and bulk-insert into target_table.
    """
    asyncio.run(_process_csv(import_id, file_path, target_table))


async def _process_csv(import_id: str, file_path: str, target_table: str):
    async with AsyncSessionLocal() as db:
        # Prepend 'rekon.' if it's one of the known engine tables and lacks a schema
        engine_tables = [
            "engine_sts_load_data", "engine_sts_load_data_his",
            "engine_sts_proses_rpt", "engine_sts_proses_rpt_his",
            "rekon_qris_aj", "rekon_qris_onus", "rekon_qris_rintis",
            "engine_job_log", "engine_job_entry_log"
        ]
        if target_table in engine_tables:
            target_table = f"rekon.{target_table}"

        # Mark as processing
        try:
            await db.execute(
                text("UPDATE app.file_imports SET status='processing' WHERE id=:id"),
                {"id": import_id}
            )
            await db.commit()
        except Exception:
            await db.rollback()

        try:
            CHUNK_SIZE = 500
            rows = []
            total_rows = 0
            processed_rows = 0
            failed_rows = 0

            with open(file_path, "r", encoding="utf-8") as f:
                # Read a sample to detect delimiter
                sample = f.read(2048)
                f.seek(0)
                
                try:
                    dialect = csv.Sniffer().sniff(sample, delimiters=',;')
                    delimiter = dialect.delimiter
                except Exception:
                    # Fallback to semicolon if sniffing fails
                    delimiter = ';'

                reader = csv.DictReader(f, delimiter=delimiter)
                # Clean header names: lowercase, strip, remove quotes
                raw_headers = reader.fieldnames or []
                headers = [h.strip().lower().replace('"', '').replace("'", "") for h in raw_headers]
                reader.fieldnames = headers

                # Map headers to valid DB columns
                for row in reader:
                    total_rows += 1
                    normalized = {
                        k: (v.strip() if v is not None else None) 
                        for k, v in row.items() 
                        if k is not None
                    }
                    
                    clean_row = {k: v for k, v in normalized.items() if k}
                    
                    if clean_row:
                        rows.append(clean_row)

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
            await db.rollback() # Ensure transaction is clean
            import traceback
            error_msg = f"{str(e)}\n{traceback.format_exc()}"
            await db.execute(
                text("UPDATE app.file_imports SET status='failed', error_log=:err WHERE id=:id"),
                {"err": {"message": str(e), "trace": traceback.format_exc()}, "id": import_id}
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
    except Exception:
        await db.rollback()
        return 0, len(rows)
