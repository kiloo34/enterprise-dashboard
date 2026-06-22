from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any, List

from app.models.audit_log import AuditLog

class ComplianceService:
    """
    Business Logic Service for UU PDP Compliance Monitoring.
    Validates Data Retention periods and detects excessive data access anomalies.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
        # Compliance Policies
        self.retention_years = 5
        self.anomaly_threshold = 10 # 10 exports in 24 hours

    async def get_compliance_report(self) -> Dict[str, Any]:
        """Generate a holistic compliance report."""
        retention_gap = await self._check_retention_gap()
        anomalies = await self._detect_anomalies()
        
        # Calculate Health Score (100 is perfect)
        score = 100
        if retention_gap > 0:
            score -= 20
        score -= len(anomalies) * 10
        score = max(0, score)
        
        return {
            "health_score": score,
            "retention_gaps": retention_gap,
            "breach_alerts": anomalies,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def _check_retention_gap(self) -> int:
        """Count how many audit logs exceed the 5-year retention period."""
        # Using naive datetime to match AuditLog.created_at default (datetime.utcnow)
        retention_cutoff_naive = datetime.utcnow() - timedelta(days=self.retention_years * 365)
        
        stmt = select(func.count(AuditLog.id)).where(AuditLog.created_at < retention_cutoff_naive)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() or 0

    async def _detect_anomalies(self) -> List[Dict[str, Any]]:
        """Detect users with excessive DATA_EXPORT actions within the last 24 hours."""
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        
        stmt = (
            select(
                AuditLog.user_id,
                AuditLog.ip_address,
                func.count(AuditLog.id).label("export_count")
            )
            .where(AuditLog.created_at >= recent_cutoff)
            .where(AuditLog.action == "DATA_EXPORT")
            .group_by(AuditLog.user_id, AuditLog.ip_address)
            .having(func.count(AuditLog.id) >= self.anomaly_threshold)
        )
        
        result = await self.db.execute(stmt)
        rows = result.all()
        
        anomalies = []
        for row in rows:
            anomalies.append({
                "user_id": row.user_id,
                "ip_address": row.ip_address,
                "incident_type": "EXCESSIVE_DATA_EXPORT",
                "count": row.export_count,
                "severity": "HIGH"
            })
            
        return anomalies
