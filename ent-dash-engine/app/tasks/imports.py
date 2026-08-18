"""
Celery CSV Import Task — Downloads from MinIO, chunked insert into target DB.

This task is triggered either by:
  - A Kafka consumer (primary, for production)
  - A direct Celery .delay() call (fallback, for dev/testing)

Big Data strategy:
  - CHUNK_SIZE=1000 rows inserted per DB transaction (keeps memory bounded).
  - ON CONFLICT DO NOTHING — idempotent re-runs.
  - Publishes `engine.data_processed` Kafka event when done.

Architecture note:
  - This task is intentionally SYNCHRONOUS (no asyncio.run).
  - Celery workers run in their own thread pool — using asyncio.run() inside
    a Celery task is an anti-pattern that can cause RuntimeError when an
    event loop is already running (e.g. when gevent/eventlet patch is active).
  - We use psycopg2 (sync) here instead of asyncpg, which is reserved for
    the FastAPI async request handlers.
"""
import csv
import io
import logging
import traceback

from sqlalchemy import create_engine, text, table, column
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import insert

from app.worker import celery_app
from app.core.config import settings
from ent_dash_common.kafka import publish_event
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1000  # Balanced for memory vs. DB round-trips

# ── Synchronous DB sessions for Celery worker ────────────────────────────────
# asyncpg (async) is for FastAPI handlers. Celery uses psycopg2 (sync).

# Engine DB — owns app.file_imports
_sync_engine = create_engine(
    settings.sqlalchemy_database_uri.replace("postgresql+asyncpg", "postgresql+psycopg2"),
    pool_size=2,
    max_overflow=2,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(bind=_sync_engine, autocommit=False, autoflush=False)

# DW DB (cbskonv) — owns rekon.*, DATAWARE.*, TABLEAU_REPORT.*
_dw_engine = create_engine(
    settings.dw_database_uri_sync,
    pool_size=2,
    max_overflow=2,
    pool_pre_ping=True,
)
DWSessionLocal = sessionmaker(bind=_dw_engine, autocommit=False, autoflush=False)

# Tables that belong to the DW DB (cbskonv)
DW_TABLES = frozenset({
    "rekon.rekon_qris_aj",
    "rekon.rekon_qris_onus",
    "rekon.rekon_qris_rintis",
})


def _get_session_for_table(target_table: str):
    """Return the correct SessionLocal based on the target table.
    rekon.* and TABLEAU_REPORT.* go to DW DB (cbskonv); everything else to Engine DB.
    """
    if target_table in DW_TABLES or '"TABLEAU_REPORT"' in target_table:
        return DWSessionLocal
    return SyncSessionLocal


@celery_app.task(bind=True, name="tasks.process_csv_import", max_retries=3, default_retry_delay=60)
def process_csv_import(self, import_id: str, object_name: str, target_table: str):
    """
    Main Celery task — called by Kafka consumer or directly.
    Fully synchronous — no asyncio.run() to avoid event loop conflicts.
    """
    logger.info(f"[Worker] Starting CSV import: {import_id}, table: {target_table}")
    # Persist Celery task ID so the API can revoke/track this task
    try:
        with SyncSessionLocal() as db:
            db.execute(
                text("UPDATE app.file_imports SET celery_task_id=:tid WHERE id=:id"),
                {"tid": self.request.id, "id": import_id},
            )
            db.commit()
    except Exception as e:
        logger.warning(f"[Worker] Failed to update celery_task_id for import {import_id}: {e}")

    try:
        _process_csv_sync(import_id, object_name, target_table)
    except Exception as exc:
        logger.error(f"[Worker] Task failed for {import_id}: {exc}")
        raise self.retry(exc=exc)


def _download_from_minio(object_name: str) -> bytes:
    """Download file bytes from MinIO synchronously."""
    from minio import Minio
    client = Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL,
    )
    response = client.get_object(settings.MINIO_BUCKET, object_name)
    data = response.read()
    response.close()
    response.release_conn()
    return data


def _process_csv_sync(import_id: str, object_name: str, target_table: str):
    """Synchronous CSV processing logic — safe to call from Celery worker."""
    # Normalize target_table schema prefix first (before routing decision)
    rekon_tables = ["rekon_qris_aj", "rekon_qris_onus", "rekon_qris_rintis"]
    if "." not in target_table:
        if target_table in rekon_tables:
            target_table = f"rekon.{target_table}"
        elif target_table == "fact_kinerjaprc":
            target_table = '"TABLEAU_REPORT".fact_kinerjaprc'
    elif target_table.startswith("TABLEAU_REPORT."):
        table_name = target_table.split(".")[-1]
        target_table = f'"TABLEAU_REPORT".{table_name}'

    # Route to correct DB: rekon.* → Recon DB, everything else → Engine DB
    SessionLocal = _get_session_for_table(target_table)

    with SyncSessionLocal() as engine_db:
        # Always update file_imports status in Engine DB
        try:
            engine_db.execute(
                text("UPDATE app.file_imports SET status='processing' WHERE id=:id"),
                {"id": import_id}
            )
            engine_db.commit()
        except Exception:
            engine_db.rollback()

    with SessionLocal() as db:

        total_rows = processed_rows = failed_rows = 0

        try:
            # Download from MinIO
            logger.info(f"[Worker] Downloading {object_name} from MinIO...")
            raw_bytes = _download_from_minio(object_name)
            csv_text = raw_bytes.decode("utf-8", errors="replace")

            # Detect delimiter
            sample = csv_text[:2048]
            try:
                import csv as csv_mod
                dialect = csv_mod.Sniffer().sniff(sample, delimiters=",;")
                delimiter = dialect.delimiter
            except Exception:
                delimiter = ";"

            reader = csv.DictReader(io.StringIO(csv_text), delimiter=delimiter)
            raw_headers = reader.fieldnames or []
            clean_headers = [h.strip().lower().replace('"', "").replace("'", "") for h in raw_headers]
            reader.fieldnames = clean_headers

            # Fetch valid DB columns once — reused for every chunk (avoids N queries)
            schema, tname = (target_table.split(".", 1) if "." in target_table else (None, target_table))
            schema = schema.strip('"') if schema else None
            tname = tname.strip('"')
            valid_cols = _get_table_columns(db, schema, tname)
            if not valid_cols:
                raise ValueError(f"Table {target_table} not found or has no columns.")
            csv_cols = set(clean_headers)
            unknown = csv_cols - valid_cols
            if unknown:
                logger.warning(
                    f"[Worker] {import_id}: Ignoring {len(unknown)} unknown CSV column(s): {sorted(unknown)}"
                )
            usable_cols = [c for c in clean_headers if c in valid_cols]
            if not usable_cols:
                raise ValueError(
                    f"No matching columns between CSV and table {target_table}. "
                    f"CSV has: {sorted(csv_cols)}. Table has: {sorted(valid_cols)}."
                )
            logger.info(f"[Worker] {import_id}: Using {len(usable_cols)}/{len(csv_cols)} CSV columns for insert.")

            rows = []
            for row in reader:
                total_rows += 1
                normalized = {
                    k: (v.strip() if v is not None else None)
                    for k, v in row.items()
                    if k is not None
                }
                clean_row = {c: normalized.get(c) for c in usable_cols}
                if any(v is not None for v in clean_row.values()):
                    rows.append(clean_row)

                if len(rows) >= CHUNK_SIZE:
                    ok, fail = _bulk_insert(db, target_table, rows, valid_cols=valid_cols)
                    processed_rows += ok
                    failed_rows += fail
                    rows = []
                    logger.info(f"[Worker] {import_id}: Processed {processed_rows}/{total_rows} rows...")

            if rows:
                ok, fail = _bulk_insert(db, target_table, rows, valid_cols=valid_cols)
                processed_rows += ok
                failed_rows += fail

            final_status = "completed" if failed_rows == 0 else "partial"
            logger.info(f"[Worker] Import {import_id} done: {processed_rows}/{total_rows} rows (failed: {failed_rows})")

            # Publish completion event to Kafka for downstream consumers (Analytics)
            publish_event(
                bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
                topic=settings.KAFKA_TOPIC_DATA_PROCESSED,
                payload={
                    "import_id": import_id,
                    "target_table": target_table,
                    "total_rows": total_rows,
                    "processed_rows": processed_rows,
                    "failed_rows": failed_rows,
                    "status": final_status,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                },
                key=import_id,
                client_id="ent-dash-engine-worker",
            )

            # Publish real-time notification via Redis PubSub
            import redis
            import json
            r = redis.Redis.from_url(settings.CELERY_BROKER_URL)
            msg = json.dumps({"type": "success", "message": f"Import {import_id} completed", "details": f"{processed_rows} rows processed successfully."})
            r.publish("notifications", json.dumps({"type": "message", "data": msg}))
            r.close()

        except Exception as e:
            db.rollback()
            err_trace = traceback.format_exc()
            logger.error(f"[Worker] Import {import_id} failed: {e}\n{err_trace}")
            # Write failure status back to Engine DB
            with SyncSessionLocal() as engine_db:
                try:
                    engine_db.execute(
                        text("UPDATE app.file_imports SET status='failed', error_log=:err WHERE id=:id"),
                        {"err": {"message": str(e), "trace": err_trace}, "id": import_id}
                    )
                    engine_db.commit()
                except Exception as e:
                    logger.warning(f"[Worker] Failed to rollback/update error log for import {import_id}: {e}")
            raise

    # Write final status to Engine DB (outside the data-writing session)
    with SyncSessionLocal() as engine_db:
        try:
            engine_db.execute(
                text("""
                    UPDATE app.file_imports
                    SET status=:status, total_rows=:total, processed_rows=:proc,
                        failed_rows=:fail, updated_at=:now
                    WHERE id=:id
                """),
                {
                    "status": final_status,
                    "total": total_rows,
                    "proc": processed_rows,
                    "fail": failed_rows,
                    "id": import_id,
                    "now": datetime.now(timezone.utc),
                }
            )
            engine_db.commit()
        except Exception as e:
            logger.warning(f"[Worker] Failed to update final status for import {import_id}: {e}")


def _get_table_columns(db, schema: str | None, table_name: str) -> set[str]:
    """Fetch actual column names from DB for the target table."""
    if schema:
        sql = text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = :schema AND table_name = :table"
        )
        result = db.execute(sql, {"schema": schema, "table": table_name})
    else:
        sql = text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = :table"
        )
        result = db.execute(sql, {"table": table_name})
    return {row[0] for row in result}


def _bulk_insert(db, target_table: str, rows: list, valid_cols: set | None = None) -> tuple[int, int]:
    """Insert a chunk of rows — idempotent via ON CONFLICT DO NOTHING. Safe against SQLi.
    valid_cols: pre-fetched set of DB column names. Rows are already filtered by caller.
    """
    if not rows:
        return 0, 0

    # Safely parse schema and table_name
    schema = None
    if "." in target_table:
        parts = target_table.split(".", 1)
        schema = parts[0].strip('"')
        table_name = parts[1].strip('"')
    else:
        table_name = target_table.strip('"')

    # Rows are already filtered upstream — just take the keys from first row
    usable_cols = list(rows[0].keys())

    # Construct dynamic SQLAlchemy table structure
    t = table(table_name, *(column(c) for c in usable_cols), schema=schema)

    try:
        stmt = insert(t).on_conflict_do_nothing()
        db.execute(stmt, rows)
        db.commit()
        return len(rows), 0
    except Exception as e:
        db.rollback()
        logger.warning(f"Bulk insert failed for chunk ({len(rows)} rows): {e}")
        return 0, len(rows)
