"""
Unit tests for RequestLoggingMiddleware.

Uses HTTPX + Starlette TestClient (via httpx.AsyncClient) to exercise
the middleware without a real database connection.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.testclient import TestClient

from app.core.middleware import RequestLoggingMiddleware


# ── Minimal Starlette app for testing ─────────────────────────────────────────

def homepage(request: Request):
    return JSONResponse({"path": str(request.url.path)}, status_code=200)

def error_endpoint(request: Request):
    return JSONResponse({"error": "server error"}, status_code=500)

def not_found(request: Request):
    return JSONResponse({"error": "not found"}, status_code=404)

def health(request: Request):
    return JSONResponse({"status": "ok"}, status_code=200)


test_app = Starlette(
    routes=[
        Route("/api/data", homepage),
        Route("/error", error_endpoint),
        Route("/missing", not_found),
        Route("/health", health),
    ]
)
test_app.add_middleware(RequestLoggingMiddleware)

client = TestClient(test_app, raise_server_exceptions=False)


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_request_id_header_present():
    """Every response must have X-Request-ID header."""
    response = client.get("/api/data")
    assert "X-Request-ID" in response.headers
    # Must be a valid UUID (36 chars with dashes)
    request_id = response.headers["X-Request-ID"]
    assert len(request_id) == 36
    assert request_id.count("-") == 4


def test_each_request_gets_unique_request_id():
    """Two requests must not share the same request_id."""
    r1 = client.get("/api/data")
    r2 = client.get("/api/data")
    assert r1.headers["X-Request-ID"] != r2.headers["X-Request-ID"]


def test_health_endpoint_passes_through():
    """/health must still return 200 (middleware skips it but doesn't block)."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_endpoint_no_request_id():
    """/health is in SKIP_PATHS so no X-Request-ID should be added."""
    response = client.get("/health")
    assert "X-Request-ID" not in response.headers


def test_info_level_logged_for_2xx(caplog):
    """2xx responses should be logged at INFO level."""
    import logging
    with caplog.at_level(logging.INFO, logger="iam.access"):
        client.get("/api/data")
    # At least one INFO log record from iam.access
    access_records = [r for r in caplog.records if r.name == "iam.access"]
    assert any(r.levelname == "INFO" for r in access_records)


def test_warning_level_logged_for_4xx(caplog):
    """4xx responses should be logged at WARNING level."""
    import logging
    with caplog.at_level(logging.WARNING, logger="iam.access"):
        client.get("/missing")
    access_records = [r for r in caplog.records if r.name == "iam.access"]
    assert any(r.levelname == "WARNING" for r in access_records)


def test_error_level_logged_for_5xx(caplog):
    """5xx responses should be logged at ERROR level."""
    import logging
    with caplog.at_level(logging.ERROR, logger="iam.access"):
        client.get("/error")
    access_records = [r for r in caplog.records if r.name == "iam.access"]
    assert any(r.levelname == "ERROR" for r in access_records)


def test_log_contains_required_fields(caplog):
    """Log record must be valid JSON with required observability fields."""
    import logging
    with caplog.at_level(logging.INFO, logger="iam.access"):
        client.get("/api/data")

    access_records = [r for r in caplog.records if r.name == "iam.access"]
    assert len(access_records) > 0

    log_data = json.loads(access_records[0].getMessage())
    required_fields = {"request_id", "method", "path", "status_code", "latency_ms"}
    assert required_fields.issubset(log_data.keys())
    assert log_data["method"] == "GET"
    assert log_data["path"] == "/api/data"
    assert log_data["status_code"] == 200
    assert isinstance(log_data["latency_ms"], float)
