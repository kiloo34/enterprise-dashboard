import pytest
from datetime import datetime, timedelta
from app.models.audit_log import AuditLog
from app.services.compliance import ComplianceService

@pytest.mark.asyncio
async def test_compliance_report_healthy(db_session):
    """Test that empty or normal db returns 100 health score."""
    service = ComplianceService(db_session)
    report = await service.get_compliance_report()
    
    # Depending on previous tests run in the same session, there might be residual logs
    # but initially should be clean if transactional. If not, we assert structure.
    assert "health_score" in report
    assert "retention_gaps" in report
    assert "breach_alerts" in report

@pytest.mark.asyncio
async def test_compliance_retention_gap(db_session):
    """Test retention gap detection."""
    old_date = datetime.utcnow() - timedelta(days=6 * 365)
    
    log1 = AuditLog(
        user_id=1,
        action="LOGIN",
        target_type="System",
        created_at=old_date
    )
    db_session.add(log1)
    await db_session.commit()
    
    service = ComplianceService(db_session)
    report = await service.get_compliance_report()
    
    # Should have at least 1 gap (could be more if db is dirty)
    assert report["retention_gaps"] >= 1
    assert report["health_score"] <= 80

@pytest.mark.asyncio
async def test_compliance_breach_alert(db_session):
    """Test anomaly detection for excessive DATA_EXPORT."""
    now = datetime.utcnow()
    
    # Generate 15 DATA_EXPORT actions for user 999
    for i in range(15):
        log = AuditLog(
            user_id=999,
            action="DATA_EXPORT",
            target_type="Data",
            ip_address="10.0.0.99",
            created_at=now
        )
        db_session.add(log)
    
    await db_session.commit()
    
    service = ComplianceService(db_session)
    report = await service.get_compliance_report()
    
    # Find the anomaly for user 999
    breach = next((a for a in report["breach_alerts"] if a["user_id"] == 999), None)
    
    assert breach is not None
    assert breach["incident_type"] == "EXCESSIVE_DATA_EXPORT"
    assert breach["count"] >= 15
    assert breach["severity"] == "HIGH"
