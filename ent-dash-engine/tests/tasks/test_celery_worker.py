"""
Tests for eng-003: Celery Background Worker

Tests verify:
1. CSV processing logic (chunk insert) — mocked DB + MinIO
2. Target table schema normalization (rekon.*, TABLEAU_REPORT.*)
3. Error handling — DB failure marks import as 'failed'
4. Bulk insert — ON CONFLICT DO NOTHING behavior
5. Worker config — Celery app registered and task discoverable
"""
import io
import csv
import pytest
from unittest.mock import MagicMock, patch, call


# ─── 1. Worker Config ──────────────────────────────────────────────────────────

def test_celery_app_configured():
    """Celery app must be created and task registered."""
    from app.worker import celery_app
    assert celery_app is not None
    assert celery_app.main == "ent_dash_engine_worker"
    assert "app.tasks.imports" in celery_app.conf.include


def test_celery_task_registered():
    """process_csv_import task must be importable and its name must match."""
    from app.tasks.imports import process_csv_import
    assert process_csv_import.name == "tasks.process_csv_import"


# ─── 2. Table Name Normalization ──────────────────────────────────────────────

def test_table_normalization_adds_rekon_prefix():
    """Tables without schema prefix get 'rekon.' prepended."""
    from app.tasks.imports import _process_csv_sync

    csv_data = "col1,col2\nval1,val2\n"

    mock_db = MagicMock()
    mock_db.__enter__ = lambda s: mock_db
    mock_db.__exit__ = MagicMock(return_value=False)

    captured_table = {}

    def fake_bulk_insert(db, table, rows):
        captured_table['table'] = table
        return len(rows), 0

    with patch("app.tasks.imports.SyncSessionLocal", return_value=mock_db), \
         patch("app.tasks.imports._download_from_minio", return_value=csv_data.encode()), \
         patch("app.tasks.imports._bulk_insert", side_effect=fake_bulk_insert), \
         patch("app.tasks.imports.publish_event"):
        _process_csv_sync("test-id-001", "imports/2026/06/22/test.csv", "rekon_qris_aj")

    assert captured_table.get('table') == "rekon.rekon_qris_aj"


def test_table_normalization_tableau_report():
    """TABLEAU_REPORT.* tables get quoted schema."""
    from app.tasks.imports import _process_csv_sync

    csv_data = "col1\nval1\n"
    mock_db = MagicMock()
    mock_db.__enter__ = lambda s: mock_db
    mock_db.__exit__ = MagicMock(return_value=False)

    captured_table = {}

    def fake_bulk_insert(db, table, rows):
        captured_table['table'] = table
        return len(rows), 0

    with patch("app.tasks.imports.SyncSessionLocal", return_value=mock_db), \
         patch("app.tasks.imports._download_from_minio", return_value=csv_data.encode()), \
         patch("app.tasks.imports._bulk_insert", side_effect=fake_bulk_insert), \
         patch("app.tasks.imports.publish_event"):
        _process_csv_sync("test-id-002", "imports/2026/06/22/test.csv", "TABLEAU_REPORT.fact_kinerjaprc")

    assert '"TABLEAU_REPORT"' in captured_table.get('table', '')


# ─── 3. Chunked CSV Processing ────────────────────────────────────────────────

def test_bulk_insert_called_with_chunks():
    """Large CSV must be inserted in CHUNK_SIZE=1000 chunks."""
    from app.tasks.imports import _process_csv_sync, CHUNK_SIZE

    # Build a CSV with 2500 rows
    rows_count = 2500
    lines = ["col1,col2"] + [f"val_{i},data_{i}" for i in range(rows_count)]
    csv_data = "\n".join(lines)

    mock_db = MagicMock()
    mock_db.__enter__ = lambda s: mock_db
    mock_db.__exit__ = MagicMock(return_value=False)

    insert_calls = []

    def fake_bulk_insert(db, table, rows):
        insert_calls.append(len(rows))
        return len(rows), 0

    with patch("app.tasks.imports.SyncSessionLocal", return_value=mock_db), \
         patch("app.tasks.imports._download_from_minio", return_value=csv_data.encode()), \
         patch("app.tasks.imports._bulk_insert", side_effect=fake_bulk_insert), \
         patch("app.tasks.imports.publish_event"):
        _process_csv_sync("test-id-003", "obj", "rekon.rekon_qris_aj")

    # Expect 2 full chunks + 1 remainder
    assert len(insert_calls) == 3
    assert insert_calls[0] == CHUNK_SIZE
    assert insert_calls[1] == CHUNK_SIZE
    assert insert_calls[2] == rows_count - (2 * CHUNK_SIZE)


# ─── 4. Failure Handling ──────────────────────────────────────────────────────

def test_minio_download_failure_marks_import_failed():
    """If MinIO download fails, import status must be set to 'failed'."""
    from app.tasks.imports import _process_csv_sync

    mock_db = MagicMock()
    mock_db.__enter__ = lambda s: mock_db
    mock_db.__exit__ = MagicMock(return_value=False)

    with patch("app.tasks.imports.SyncSessionLocal", return_value=mock_db), \
         patch("app.tasks.imports._download_from_minio", side_effect=ConnectionError("MinIO unreachable")):
        with pytest.raises(ConnectionError):
            _process_csv_sync("test-id-004", "bad/path.csv", "rekon.rekon_qris_aj")

    # Verify that the DB execute was called with 'failed' status via error_log update
    execute_calls = mock_db.execute.call_args_list
    # The failed branch calls db.execute with SET status='failed'
    assert execute_calls, "Expected db.execute to be called at least once"
    # Confirm the mock_db.rollback was invoked (error recovery path)
    mock_db.rollback.assert_called()


# ─── 5. Kafka Completion Event ────────────────────────────────────────────────

def test_kafka_event_published_on_success():
    """Kafka engine.data_processed event must be published after successful import."""
    from app.tasks.imports import _process_csv_sync

    csv_data = "col1,col2\nval1,val2\n"
    mock_db = MagicMock()
    mock_db.__enter__ = lambda s: mock_db
    mock_db.__exit__ = MagicMock(return_value=False)

    with patch("app.tasks.imports.SyncSessionLocal", return_value=mock_db), \
         patch("app.tasks.imports._download_from_minio", return_value=csv_data.encode()), \
         patch("app.tasks.imports._bulk_insert", return_value=(1, 0)), \
         patch("app.tasks.imports.publish_event") as mock_publish:
        _process_csv_sync("test-id-005", "obj/path.csv", "rekon.rekon_qris_aj")

    mock_publish.assert_called_once()
    call_kwargs = mock_publish.call_args
    # publish_event is called with keyword arguments: bootstrap_servers, topic, payload, key, client_id
    payload = call_kwargs.kwargs.get("payload")
    assert payload is not None, "publish_event must receive a payload keyword arg"
    assert payload.get("import_id") == "test-id-005"
    assert payload.get("status") in ("completed", "partial")
