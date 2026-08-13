"""
Tests for Recon API routes (qa-006)

Verifies:
1. /rekon/status endpoint
2. /rekon/dashboard/aj-stats  endpoint
3. /rekon/dashboard/rintis-stats endpoint
4. /rekon/dashboard/onus-stats endpoint
5. /rekon/dashboard/qris-transactions (pagination)
6. /rekon/dashboard/rintis-transactions (pagination)
7. /rekon/dashboard/onus-transactions (pagination)
8. POST /rekon/reconcile/{network} trigger endpoint
9. Invalid network returns 400
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.api.routes.rekon import router
from app.db.session import get_db


# ── App Fixture ───────────────────────────────────────────────────────────────

def _build_test_app(db_override) -> FastAPI:
    """Creates a minimal FastAPI app with the recon router and a DB override."""
    app = FastAPI()
    app.include_router(router, prefix="/rekon")
    app.dependency_overrides[get_db] = db_override
    return app


def _make_mock_db(scalar_values=None, execute_result=None):
    """
    Factory for an async mock DB session.

    scalar_values: list of values returned by successive `db.scalar()` calls.
    execute_result: the scalars().all() return for `db.execute()` calls.
    """
    db = AsyncMock(spec=AsyncSession)

    if scalar_values is not None:
        db.scalar.side_effect = scalar_values

    if execute_result is not None:
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = execute_result
        db.execute.return_value = mock_result

    return db


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_aj_row(id_row="row1", amount=100_000.0, status="MATCH", date=None):
    row = MagicMock()
    row.id_row = id_row
    row.transaction_date = date or datetime(2026, 6, 22, 10, 0, 0)
    row.transaction_amount = amount
    row.is_cbs = True
    row.is_biller = True
    row.status_rekon = status
    return row


def _make_rintis_row(id=1, merchant="Merchant Rintis", amount=200_000.0, status="MATCH", date=None):
    row = MagicMock()
    row.id = id
    row.transaction_date = date or datetime(2026, 6, 22, 12, 0, 0)
    row.transaction_amount = amount
    row.merchant_name = merchant
    row.trace_no = f"trace_{id}"
    row.invoice_number = f"inv_{id}"
    row.is_cbs = True
    row.is_biller = True
    row.status_rekon = status
    return row


def _make_onus_row(id=1, merchant="Merchant ONUS", amount=50_000.0, status="MATCH", date=None):
    row = MagicMock()
    row.id = id
    row.transaction_date = date or datetime(2026, 6, 22, 14, 0, 0)
    row.transaction_amount = amount
    row.merchant_name = merchant
    row.ref_core = f"core_{id}"
    row.ref_biller = f"biller_{id}"
    row.is_cbs = True
    row.is_biller = True
    row.status_rekon = status
    return row


# ── Status Endpoint ───────────────────────────────────────────────────────────

def test_status_endpoint():
    """GET /rekon/status returns the expected service metadata."""
    db = _make_mock_db()
    app = _build_test_app(lambda: db)
    client = TestClient(app)

    response = client.get("/rekon/status")

    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Recon Service"
    assert data["status"] == "active"
    assert data["models_loaded"] is True


# ── Stats Endpoints ───────────────────────────────────────────────────────────

class TestAjStats:
    def _client(self, total=10, settled=5_000_000.0, unsettled=1_000_000.0):
        db = _make_mock_db(scalar_values=[total, settled, unsettled])
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_correct_shape(self):
        client = self._client()
        response = client.get("/rekon/dashboard/aj-stats")
        assert response.status_code == 200
        data = response.json()
        assert "totalTransactions" in data
        assert "settledAmount" in data
        assert "unsettledAmount" in data
        assert "totalDiscrepancyAmount" in data

    def test_values_propagated_correctly(self):
        client = self._client(total=25, settled=3_000_000.0, unsettled=500_000.0)
        data = client.get("/rekon/dashboard/aj-stats").json()
        assert data["totalTransactions"] == 25
        assert data["settledAmount"] == pytest.approx(3_000_000.0)
        assert data["unsettledAmount"] == pytest.approx(500_000.0)
        # totalDiscrepancyAmount mirrors unsettledAmount
        assert data["totalDiscrepancyAmount"] == pytest.approx(500_000.0)

    def test_handles_zero_amounts(self):
        client = self._client(total=0, settled=None, unsettled=None)
        data = client.get("/rekon/dashboard/aj-stats").json()
        assert data["totalTransactions"] == 0
        assert data["settledAmount"] == pytest.approx(0.0)
        assert data["unsettledAmount"] == pytest.approx(0.0)


class TestRintisStats:
    def _client(self, total=5, settled=2_000_000.0, unsettled=0.0):
        db = _make_mock_db(scalar_values=[total, settled, unsettled])
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_correct_shape(self):
        response = self._client().get("/rekon/dashboard/rintis-stats")
        assert response.status_code == 200
        data = response.json()
        for key in ("totalTransactions", "settledAmount", "unsettledAmount", "totalDiscrepancyAmount"):
            assert key in data

    def test_values_propagated_correctly(self):
        data = self._client(total=8, settled=1_500_000.0, unsettled=250_000.0).get(
            "/rekon/dashboard/rintis-stats"
        ).json()
        assert data["totalTransactions"] == 8
        assert data["settledAmount"] == pytest.approx(1_500_000.0)


class TestOnusStats:
    def _client(self, total=3, settled=800_000.0, unsettled=50_000.0):
        db = _make_mock_db(scalar_values=[total, settled, unsettled])
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_correct_shape(self):
        response = self._client().get("/rekon/dashboard/onus-stats")
        assert response.status_code == 200

    def test_values_propagated_correctly(self):
        data = self._client(total=7, settled=600_000.0, unsettled=100_000.0).get(
            "/rekon/dashboard/onus-stats"
        ).json()
        assert data["totalTransactions"] == 7
        assert data["settledAmount"] == pytest.approx(600_000.0)


# ── Transaction Listing Endpoints ─────────────────────────────────────────────

class TestQrisTransactions:
    def _client(self, total=2, rows=None):
        if rows is None:
            rows = [_make_aj_row("r1", 100_000.0, "MATCH"), _make_aj_row("r2", 50_000.0, "UNMATCH")]
        db = _make_mock_db(scalar_values=[total], execute_result=rows)
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_transactions_and_total(self):
        response = self._client().get("/rekon/dashboard/qris-transactions")
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "total" in data
        assert data["total"] == 2

    def test_transaction_shape(self):
        rows = [_make_aj_row("tx001", 75_000.0, "MATCH")]
        client = self._client(total=1, rows=rows)
        data = client.get("/rekon/dashboard/qris-transactions").json()
        tx = data["transactions"][0]
        for key in ("id", "timestamp", "merchant", "stan", "nominal", "bankStatus", "artajasaStatus", "reconStatus"):
            assert key in tx

    def test_pagination_params_accepted(self):
        response = self._client().get("/rekon/dashboard/qris-transactions?limit=5&offset=0")
        assert response.status_code == 200

    def test_invalid_limit_rejected(self):
        """limit must be >= 1 per Query constraint."""
        response = self._client().get("/rekon/dashboard/qris-transactions?limit=0")
        assert response.status_code == 422

    def test_transaction_date_none_handled(self):
        row = _make_aj_row("no_date")
        row.transaction_date = None
        client = self._client(total=1, rows=[row])
        data = client.get("/rekon/dashboard/qris-transactions").json()
        assert data["transactions"][0]["timestamp"] == ""


class TestRintisTransactions:
    def _client(self, total=1, rows=None):
        if rows is None:
            rows = [_make_rintis_row(id=1, amount=200_000.0, status="MATCH")]
        db = _make_mock_db(scalar_values=[total], execute_result=rows)
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_correct_shape(self):
        data = self._client().get("/rekon/dashboard/rintis-transactions").json()
        assert "transactions" in data
        assert "total" in data

    def test_transaction_shape(self):
        data = self._client().get("/rekon/dashboard/rintis-transactions").json()
        tx = data["transactions"][0]
        for key in ("id", "timestamp", "merchant", "stan", "nominal", "reconStatus"):
            assert key in tx

    def test_pagination_params_accepted(self):
        response = self._client().get("/rekon/dashboard/rintis-transactions?limit=3&offset=3")
        assert response.status_code == 200


class TestOnusTransactions:
    def _client(self, total=1, rows=None):
        if rows is None:
            rows = [_make_onus_row(id=1, amount=50_000.0, status="MATCH")]
        db = _make_mock_db(scalar_values=[total], execute_result=rows)
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def test_returns_200_with_correct_shape(self):
        data = self._client().get("/rekon/dashboard/onus-transactions").json()
        assert "transactions" in data and "total" in data

    def test_transaction_shape(self):
        data = self._client().get("/rekon/dashboard/onus-transactions").json()
        tx = data["transactions"][0]
        for key in ("id", "timestamp", "merchant", "stan", "nominal", "reconStatus"):
            assert key in tx

    def test_invalid_offset_rejected(self):
        """offset must be >= 0 per Query constraint."""
        response = self._client().get("/rekon/dashboard/onus-transactions?offset=-1")
        assert response.status_code == 422


# ── Reconcile Trigger Endpoint ─────────────────────────────────────────────────

class TestReconcileTrigger:
    def _client(self):
        db = _make_mock_db()
        app = _build_test_app(lambda: db)
        return TestClient(app)

    def _mock_task(self, task_id="task-xyz"):
        mock = MagicMock()
        mock.id = task_id
        return mock

    def test_trigger_aj_network(self):
        client = self._client()
        task = self._mock_task("aj-task-1")
        with patch("app.tasks.reconciliation.reconcile_qris_aj") as mock_fn:
            mock_fn.delay.return_value = task
            response = client.post("/rekon/reconcile/aj")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "triggered"
        assert data["task_id"] == "aj-task-1"

    def test_trigger_rintis_network(self):
        client = self._client()
        task = self._mock_task("rintis-task-1")
        with patch("app.tasks.reconciliation.reconcile_qris_rintis") as mock_fn:
            mock_fn.delay.return_value = task
            response = client.post("/rekon/reconcile/rintis")
        assert response.status_code == 200
        assert response.json()["status"] == "triggered"

    def test_trigger_onus_network(self):
        client = self._client()
        task = self._mock_task("onus-task-1")
        with patch("app.tasks.reconciliation.reconcile_qris_onus") as mock_fn:
            mock_fn.delay.return_value = task
            response = client.post("/rekon/reconcile/onus")
        assert response.status_code == 200
        assert response.json()["status"] == "triggered"

    def test_invalid_network_returns_400(self):
        client = self._client()
        response = client.post("/rekon/reconcile/invalid_network")
        assert response.status_code == 400

    def test_unknown_network_error_message(self):
        client = self._client()
        response = client.post("/rekon/reconcile/unknown")
        assert response.status_code == 400
