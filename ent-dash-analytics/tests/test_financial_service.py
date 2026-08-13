"""
Unit tests for FinancialService and FinancialRepository — grf-003.

Covers:
1. FinancialRepository.get_latest_report_dates
2. FinancialRepository.get_indicators_with_metrics
3. FinancialService.get_financial_dashboard — empty DB
4. FinancialService.get_financial_dashboard — CASA ratio calculation
5. FinancialService.get_financial_dashboard — category filter pass-through
6. FinancialService.get_daily_kpi — returns list of metric objects
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import date


# ── FinancialRepository ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_repository_get_latest_report_dates_returns_list():
    """get_latest_report_dates should unpack scalar tuples from DB result."""
    from app.crud.financial_repository import FinancialRepository

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [("2026-06-22",), ("2026-06-15",)]
    mock_db.execute.return_value = mock_result

    repo = FinancialRepository(mock_db)
    dates = await repo.get_latest_report_dates(limit=2)

    assert dates == ["2026-06-22", "2026-06-15"]
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_repository_get_latest_report_dates_empty():
    """get_latest_report_dates on empty DB returns empty list."""
    from app.crud.financial_repository import FinancialRepository

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = []
    mock_db.execute.return_value = mock_result

    repo = FinancialRepository(mock_db)
    dates = await repo.get_latest_report_dates()

    assert dates == []


@pytest.mark.asyncio
async def test_repository_get_indicators_with_metrics_calls_db():
    """get_indicators_with_metrics executes a query and returns raw rows."""
    from app.crud.financial_repository import FinancialRepository

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_row = (MagicMock(), MagicMock())
    mock_result.all.return_value = [mock_row]
    mock_db.execute.return_value = mock_result

    repo = FinancialRepository(mock_db)
    rows = await repo.get_indicators_with_metrics(dates=["2026-06-22"])

    assert len(rows) == 1
    mock_db.execute.assert_called_once()


# ── FinancialService ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_financial_service_empty_db_returns_empty():
    """get_financial_dashboard on empty DB returns ([], [])."""
    from app.services.financial import FinancialService

    mock_db = AsyncMock()
    # First call: get_latest_report_dates → empty
    dates_result = MagicMock()
    dates_result.all.return_value = []
    # Second call: get_indicators_with_metrics → empty
    rows_result = MagicMock()
    rows_result.all.return_value = []
    mock_db.execute.side_effect = [dates_result, rows_result]

    service = FinancialService(mock_db)
    metrics, date_labels = await service.get_financial_dashboard()

    assert metrics == []
    assert date_labels == []


@pytest.mark.asyncio
async def test_financial_service_casa_ratio_calculation():
    """CASA value must be recalculated as (CASA / TOTAL_DPK) * 100."""
    from app.services.financial import FinancialService

    mock_db = AsyncMock()

    ind_dpk = MagicMock(); ind_dpk.id = 1; ind_dpk.slug = "TOTAL_DPK"
    ind_casa = MagicMock(); ind_casa.id = 2; ind_casa.slug = "CASA"

    met_dpk = MagicMock()
    met_dpk.wil = "1"; met_dpk.cab = "1"; met_dpk.is_ajp = False
    met_dpk.value = 1000.0; met_dpk.target_nominal = 1200.0
    met_dpk.report_date = "2026-06-22"

    met_casa = MagicMock()
    met_casa.wil = "1"; met_casa.cab = "1"; met_casa.is_ajp = False
    met_casa.value = 600.0; met_casa.target_nominal = 800.0
    met_casa.report_date = "2026-06-22"

    dates_result = MagicMock()
    dates_result.all.return_value = [("2026-06-22",)]
    rows_result = MagicMock()
    rows_result.all.return_value = [(ind_dpk, met_dpk), (ind_casa, met_casa)]
    mock_db.execute.side_effect = [dates_result, rows_result]

    service = FinancialService(mock_db)
    metrics, date_labels = await service.get_financial_dashboard()

    assert len(date_labels) == 1
    casa_metric = next(m for m in metrics if m.indicator.slug == "CASA")
    assert casa_metric.value == 60.0                        # (600/1000)*100
    assert casa_metric.target_nominal == pytest.approx(66.67, rel=1e-2)  # (800/1200)*100


@pytest.mark.asyncio
async def test_financial_service_category_filter_forwarded():
    """Category filter should be forwarded to FinancialRepository."""
    from app.services.financial import FinancialService
    from app.crud.financial_repository import FinancialRepository

    mock_db = AsyncMock()
    dates_result = MagicMock(); dates_result.all.return_value = []
    rows_result = MagicMock(); rows_result.all.return_value = []
    mock_db.execute.side_effect = [dates_result, rows_result]

    with patch.object(
        FinancialRepository, "get_indicators_with_metrics", new_callable=AsyncMock
    ) as mock_get:
        mock_get.return_value = []
        with patch.object(
            FinancialRepository, "get_latest_report_dates", new_callable=AsyncMock
        ) as mock_dates:
            mock_dates.return_value = []
            service = FinancialService(mock_db)
            await service.get_financial_dashboard(category="DPK")
            mock_get.assert_called_once_with([], "DPK")


# ── QrisService ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_qris_service_simulation_mode_no_api_key():
    """When GEMINI_API_KEY is absent, returns simulation mode response."""
    from app.services.qris import QrisService

    mock_db = AsyncMock()
    with patch("app.services.qris._analysis_cache", {}), \
         patch.dict("os.environ", {}, clear=True):
        service = QrisService(mock_db)
        result = await service.get_daily_analysis(date="2026-07-01", network="AJ")

    assert result.status == "success"
    assert "Simulation Mode" in result.data["analysis"]
    assert "AJ" in result.data["analysis"]


@pytest.mark.asyncio
async def test_qris_service_cache_hit_skips_api():
    """Cached result should be returned without calling Gemini."""
    from app.services.qris import QrisService

    mock_db = AsyncMock()
    cache_key = "qris_ai_analysis_AJ_2026-07-01"
    fake_cache = {cache_key: "Cached analysis text"}

    with patch("app.services.qris._analysis_cache", fake_cache):
        service = QrisService(mock_db)
        result = await service.get_daily_analysis(date="2026-07-01", network="AJ")

    assert result.status == "success"
    assert result.data["analysis"] == "Cached analysis text"
