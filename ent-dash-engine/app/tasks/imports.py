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

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.worker import celery_app
from app.core.config import settings
from ent_dash_common.kafka import publish_event
from datetime import datetime

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1000  # Balanced for memory vs. DB round-trips

# ── Synchronous DB session for Celery worker ─────────────────────────────────
# asyncpg (async) is for FastAPI handlers. Celery uses psycopg2 (sync).
_sync_engine = create_engine(
    settings.sqlalchemy_database_uri.replace(
        "postgresql+asyncpg", "postgresql+psycopg2"
    ),
    pool_size=2,
    max_overflow=2,
    pool_pre_ping=True,
)
SyncSessionLocal = sessionmaker(bind=_sync_engine, autocommit=False, autoflush=False)


@celery_app.task(bind=True, name="tasks.process_csv_import", max_retries=3, default_retry_delay=60)
def process_csv_import(self, import_id: str, object_name: str, target_table: str):
    """
    Main Celery task — called by Kafka consumer or directly.
    Fully synchronous — no asyncio.run() to avoid event loop conflicts.
    """
    logger.info(f"[Worker] Starting CSV import: {import_id}, table: {target_table}")
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
    with SyncSessionLocal() as db:
        # Normalize target_table schema prefix
        engine_tables = [
            "engine_sts_load_data", "engine_sts_load_data_his",
            "engine_sts_proses_rpt", "engine_sts_proses_rpt_his",
            "rekon_qris_aj", "rekon_qris_onus", "rekon_qris_rintis",
            "engine_job_log", "engine_job_entry_log"
        ]
        if "." not in target_table:
            if target_table in engine_tables:
                target_table = f"rekon.{target_table}"
            elif target_table == "fact_kinerjaprc":
                target_table = '"TABLEAU_REPORT".fact_kinerjaprc'
        elif target_table.startswith("TABLEAU_REPORT."):
            table_name = target_table.split(".")[-1]
            target_table = f'"TABLEAU_REPORT".{table_name}'

        # Mark as processing
        try:
            db.execute(
                text("UPDATE app.file_imports SET status='processing' WHERE id=:id"),
                {"id": import_id}
            )
            db.commit()
        except Exception:
            db.rollback()

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

            rows = []
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
                    ok, fail = _bulk_insert(db, target_table, rows)
                    processed_rows += ok
                    failed_rows += fail
                    rows = []
                    logger.info(f"[Worker] {import_id}: Processed {processed_rows}/{total_rows} rows...")

            if rows:
                ok, fail = _bulk_insert(db, target_table, rows)
                processed_rows += ok
                failed_rows += fail

            final_status = "completed" if failed_rows == 0 else "partial"
            db.execute(
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
                    "now": datetime.utcnow(),
                }
            )
            db.commit()
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
                    "completed_at": datetime.utcnow().isoformat(),
                },
                key=import_id,
                client_id="ent-dash-engine-worker",
            )

        except Exception as e:
            db.rollback()
            err_trace = traceback.format_exc()
            logger.error(f"[Worker] Import {import_id} failed: {e}\n{err_trace}")
            try:
                db.execute(
                    text("UPDATE app.file_imports SET status='failed', error_log=:err WHERE id=:id"),
                    {"err": {"message": str(e), "trace": err_trace}, "id": import_id}
                )
                db.commit()
            except Exception:
                pass
            raise


def _bulk_insert(db, target_table: str, rows: list) -> tuple[int, int]:
    """Insert a chunk of rows — idempotent via ON CONFLICT DO NOTHING."""
    if not rows:
        return 0, 0
    cols = list(rows[0].keys())
    col_names = ", ".join(f'"{c}"' for c in cols)
    placeholders = ", ".join(f":{c}" for c in cols)
    try:
        db.execute(
            text(f"INSERT INTO {target_table} ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"),
            rows
        )
        db.commit()
        return len(rows), 0
    except Exception as e:
        db.rollback()
        logger.warning(f"Bulk insert failed for chunk ({len(rows)} rows): {e}")
        return 0, len(rows)
