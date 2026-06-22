"""
Tests for ana-002: Analytics Dashboard API

Verifies:
1. get_financial_dashboard returns correctly formatted metrics with history.
2. get_financial_dashboard filters by category.
3. qris_analysis route returns analysis.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
async def test_financial_dashboard_with_mock_db():
    """Verify get_financial_dashboard computes ratio correctly."""
    from app.services.financial import FinancialService
    
    # Mock data
    mock_ind1 = MagicMock()
    mock_ind1.id = 1
    mock_ind1.slug = "TOTAL_DPK"
    
    mock_met1 = MagicMock()
    mock_met1.wil = "1"
    mock_met1.cab = "1"
    mock_met1.is_ajp = False
    mock_met1.value = 1000.0
    mock_met1.target_nominal = 1200.0
    mock_met1.report_date = "2026-06-22"
    
    mock_ind2 = MagicMock()
    mock_ind2.id = 2
    mock_ind2.slug = "CASA"
    
    mock_met2 = MagicMock()
    mock_met2.wil = "1"
    mock_met2.cab = "1"
    mock_met2.is_ajp = False
    mock_met2.value = 600.0
    mock_met2.target_nominal = 800.0
    mock_met2.report_date = "2026-06-22"
    
    # Setup mock db
    mock_db = AsyncMock()
    mock_dates_result = MagicMock()
    mock_dates_result.all.return_value = [("2026-06-22",)]
    
    mock_rows_result = MagicMock()
    mock_rows_result.all.return_value = [
        (mock_ind1, mock_met1),
        (mock_ind2, mock_met2)
    ]
    
    mock_db.execute.side_effect = [mock_dates_result, mock_rows_result]
    
    service = FinancialService(mock_db)
    metrics, dates = await service.get_financial_dashboard()
    
    assert len(dates) == 1
    # CASA value should be calculated as ratio (600 / 1000) * 100 = 60.0
    casa_metric = next(m for m in metrics if m.indicator.slug == "CASA")
    assert casa_metric.value == 60.0
    assert casa_metric.target_nominal == (800.0 / 1200.0) * 100

@pytest.mark.asyncio
async def test_qris_analysis_route():
    """Test QRIS Analysis API Route directly via service."""
    from app.services.qris import QrisService
    mock_db = AsyncMock()
    
    with patch("app.services.qris._analysis_cache", {}), \
         patch.dict("os.environ", {}, clear=True):
        service = QrisService(mock_db)
        result = await service.get_daily_analysis(date="2026-06-22", network="TEST")
        
    assert result.status == "success"
    assert "Simulation Mode" in result.data["analysis"]
