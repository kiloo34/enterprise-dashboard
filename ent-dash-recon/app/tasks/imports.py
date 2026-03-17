 import csv
import io
import asyncio
import json
from datetime import datetime, timezone

from app.worker import celery_app
from app.db.session import AsyncSessionLocal
from sqlalchemy import text


from app.services.imports import detect_delimiter, validate_csv_structure

# ─── Task Definition ──────────────────────────────────────────────────────────


@celery_app.task(bind=True, name="tasks.process_csv_import", max_retries=3)
def process_csv_import(self, import_id: str, file_path: str, target_table: str):
    """
    Background task to process a CSV/TXT file and bulk-insert into target_table.
    """
    try:
        # Use a fresh loop for each task to avoid loop-mismatch errors in Celery workers
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(_process_csv(import_id, file_path, target_table))
        finally:
            loop.close()
    except Exception as e:
        import logging
        logging.error(f"Fatal error in process_csv_import task for {import_id}: {str(e)}")
        raise


async def _get_table_schema(db, target_table: str) -> dict[str, dict[str, str]]:
    """
    Fetch column names and data types for the target table.
    Returns a dict {column_name_lower: {"name": original_name, "type": data_type}}.
    """
    schema_name = "public"
    table_name = target_table
    
    # Clean quotes and split schema
    clean_target = target_table.replace('"', '')
    if "." in clean_target:
        parts = clean_target.split(".")
        schema_name = parts[0]
        table_name = parts[1]
    
    # Try case-sensitive first, then case-insensitive
    query = text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE (table_schema = :schema AND table_name = :table)
           OR (lower(table_schema) = lower(:schema) AND lower(table_name) = lower(:table))
        ORDER BY ordinal_position
    """)
    
    result = await db.execute(query, {"schema": schema_name, "table": table_name})
    rows = result.fetchall()
    
    if not rows:
        import logging
        logging.warning(f"No columns found for {schema_name}.{table_name} in information_schema. Trying default public schema.")
        result = await db.execute(query, {"schema": "public", "table": table_name})
        rows = result.fetchall()

    return {row[0].lower(): {"name": row[0], "type": row[1]} for row in rows}


def _cast_value(value: str | None, data_type: str) -> any:
    """Perform smart casting based on PostgreSQL data type."""
    if value is None or (isinstance(value, str) and (value.strip() == "" or value.lower() == "null")):
        return None
    
    val = str(value).strip()
    dt = data_type.lower()
    
    try:
        if "boolean" in dt:
            return val.lower() in ("true", "t", "1", "yes", "y", "ya")
        
        if "integer" in dt or "bigint" in dt or "smallint" in dt:
            # Remove thousand separators if any (dots or commas)
            clean_val = val.replace(".", "").replace(",", "")
            return int(clean_val)
            
        if "numeric" in dt or "decimal" in dt or "double" in dt or "real" in dt:
            # Handle Indonesian format: dots as thousand sep, comma as decimal
            if "," in val and "." in val:
                clean_val = val.replace(".", "").replace(",", ".")
            elif "," in val:
                # Heuristic: if comma is near the end, it's decimal.
                if len(val.split(",")[-1]) <= 2:
                    clean_val = val.replace(",", ".")
                else:
                    clean_val = val.replace(",", "")
            else:
                clean_val = val
            return float(clean_val)
            
        if "date" in dt or "timestamp" in dt:
            # Common formats: YYYY-MM-DD, DD/MM/YYYY, etc.
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d", "%d-%m-%Y"):
                try:
                    dt_obj = datetime.strptime(val, fmt)
                    return dt_obj.date() if "date" == dt else dt_obj
                except ValueError:
                    continue
            return val
            
    except Exception:
        return val
        
    return val


async def _process_csv(import_id: str, file_path: str, target_table: str):
    async with AsyncSessionLocal() as db:
        # Normalize target_table
        if "." not in target_table:
            engine_tables = [
                "engine_sts_load_data", "engine_sts_load_data_his",
                "engine_sts_proses_rpt", "engine_sts_proses_rpt_his",
                "rekon_qris_aj", "rekon_qris_onus", "rekon_qris_rintis",
                "engine_job_log", "engine_job_entry_log"
            ]
            if target_table in engine_tables:
                target_table = f"rekon.{target_table}"
            elif target_table == "fact_kinerjaprc":
                target_table = f'"TABLEAU_REPORT".{target_table}'
        elif target_table.startswith("TABLEAU_REPORT."):
            table_name = target_table.split(".")[-1]
            target_table = f'"TABLEAU_REPORT".{table_name}'

        await db.execute(
            text("UPDATE app.file_imports SET status='processing' WHERE id=:id"),
            {"id": import_id}
        )
        await db.commit()

        try:
            # Fetch Schema for casting
            schema_meta = await _get_table_schema(db, target_table)
            if not schema_meta:
                 raise ValueError(f"Tabel tujuan {target_table} tidak ditemukan di database.")

            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                sample = f.read(8192)

            if not sample.strip():
                raise ValueError("File kosong atau tidak dapat dibaca.")

            delimiter = detect_delimiter(sample)
            if delimiter is None:
                raise ValueError("Format CSV tidak dideteksi.")

            # Pre-count rows
            total_rows = 0
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                total_rows = max(0, sum(1 for _ in f) - 1)

            await db.execute(
                text("UPDATE app.file_imports SET total_rows=:total, updated_at=now() WHERE id=:id"),
                {"total": total_rows, "id": import_id}
            )
            await db.commit()

            # Process the file in chunks
            CHUNK_SIZE = 1000
            rows = []
            processed_rows = 0
            failed_rows = 0
            error_counts = {} # message -> count

            # Improved Header Matching
            def _clean_h(h: str) -> str:
                if not h: return ""
                # Remove quotes, #, spaces, and replace dots/dashes with underscore
                res = h.strip().lower().replace('"', '').replace("'", "").replace("#", "")
                res = res.replace(" ", "_").replace(".", "_").replace("-", "_")
                # Collapse multiple underscores
                while "__" in res: res = res.replace("__", "_")
                return res.strip("_")

            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.DictReader(f, delimiter=delimiter)
                # Map headers to schema
                raw_headers = reader.fieldnames or []
                csv_headers_clean = [_clean_h(h) for h in raw_headers]
                
                # Check for direct matches first, then fuzzy matches
                column_mapping = {}
                schema_cols_clean = { _clean_h(k): v for k, v in schema_meta.items() }

                for i, h_clean in enumerate(csv_headers_clean):
                    orig_h = raw_headers[i]
                    # Strategy 1: Exact lowercase match
                    if h_clean in schema_meta:
                        column_mapping[orig_h] = schema_meta[h_clean]
                    # Strategy 2: Cleaned match (e.g. "Transaction ID" -> "transaction_id")
                    elif h_clean in schema_cols_clean:
                        column_mapping[orig_h] = schema_cols_clean[h_clean]
                    # Strategy 3: Handle common variations
                    else:
                        variations = {
                            "transactionid": "transaction_id",
                            "userid": "user_id",
                            "createdat": "created_at",
                            "updatedat": "updated_at",
                        }
                        mapped_v = variations.get(h_clean)
                        if mapped_v and mapped_v in schema_meta:
                            column_mapping[orig_h] = schema_meta[mapped_v]

                if not column_mapping:
                    available_db_cols = ", ".join(schema_meta.keys())
                    raise ValueError(
                        f"Header CSV ({', '.join(raw_headers)}) tidak cocok dengan kolom database ({available_db_cols}). "
                        "Pastikan nama kolom di file CSV sesuai dengan yang diharapkan."
                    )

                for row_idx, raw_row in enumerate(reader):
                    try:
                        normalized = {}
                        for h_lower, meta in column_mapping.items():
                            # Find original key in raw_row
                            orig_key = next((k for k in raw_row.keys() if k.strip().lower() == h_lower), None)
                            if orig_key:
                                val = raw_row[orig_key]
                                normalized[meta["name"]] = _cast_value(val, meta["type"])
                        
                        rows.append(normalized)
                    except Exception as row_err:
                        failed_rows += 1
                        msg = str(row_err)
                        error_counts[msg] = error_counts.get(msg, 0) + 1
                        continue

                    if len(rows) >= CHUNK_SIZE:
                        # Check for cancellation
                        check_res = await db.execute(
                            text("SELECT status FROM app.file_imports WHERE id=:id"),
                            {"id": import_id}
                        )
                        current_status = check_res.scalar()
                        if current_status == "cancelled":
                            logging.info(f"Import {import_id} cancelled by user. Stopping.")
                            return

                        # Update progress every 5000 rows
                        if processed_rows % 5000 == 0:
                            await db.execute(
                                text("UPDATE app.file_imports SET processed_rows=:proc, failed_rows=:fail, updated_at=now() WHERE id=:id"),
                                {"proc": processed_rows, "fail": failed_rows, "id": import_id}
                            )
                            await db.commit()

                        ok, fail, err = await _bulk_insert(db, target_table, rows)
                        processed_rows += ok
                        failed_rows += fail
                        if err:
                            error_counts[err] = error_counts.get(err, 0) + len(rows)
                        rows = []

                        # Update progress
                        if processed_rows % 5000 == 0:
                            await db.execute(
                                text("UPDATE app.file_imports SET processed_rows=:proc, failed_rows=:fail, updated_at=now() WHERE id=:id"),
                                {"proc": processed_rows, "fail": failed_rows, "id": import_id}
                            )
                            await db.commit()

                if rows:
                    ok, fail, err = await _bulk_insert(db, target_table, rows)
                    processed_rows += ok
                    failed_rows += fail
                    if err:
                        error_counts[err] = error_counts.get(err, 0) + len(rows)

            final_status = "completed" if failed_rows == 0 else "partial"
            error_log_val = None
            if error_counts:
                error_log_val = json.dumps({"errors": error_counts, "failed_rows_total": failed_rows, "timestamp": datetime.now(timezone.utc).isoformat()})

            await db.execute(
                text("""
                    UPDATE app.file_imports
                    SET status=:status, total_rows=:total, processed_rows=:proc, failed_rows=:fail,
                        error_log=CASE WHEN :err IS NOT NULL THEN CAST(:err AS jsonb) ELSE error_log END,
                        updated_at=now()
                    WHERE id=:id
                """),
                {"status": final_status, "total": total_rows, "proc": processed_rows, "fail": failed_rows, "err": error_log_val, "id": import_id}
            )
            await db.commit()

        except Exception as e:
            import traceback
            error_detail = json.dumps({
                "message": str(e),
                "traceback": traceback.format_exc()[-500:],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            await db.execute(
                text("UPDATE app.file_imports SET status='failed', error_log=CAST(:err AS jsonb), updated_at=now() WHERE id=:id"),
                {"err": error_detail, "id": import_id}
            )
            await db.commit()


async def _bulk_insert(db, target_table: str, rows: list) -> tuple[int, int, str | None]:
    """Insert a chunk of rows into target_table."""
    if not rows:
        return 0, 0, None

    cols = list(rows[0].keys())
    col_names = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(f":{c}" for c in cols)

    try:
        await db.execute(
            text(f"INSERT INTO {target_table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"),
            rows
        )
        await db.commit()
        return len(rows), 0, None
    except Exception as e:
        import logging
        logging.error(f"Bulk insert failed for table {target_table}: {str(e)}")
        await db.rollback()
        return 0, len(rows), str(e)
