from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: int | None,
        action: str,
        target_type: str,
        target_id: str | None = None,
        details: dict | None = None
    ) -> AuditLog:
        """
        Creates an audit log entry for a specific action.
        """
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details
        )
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        return audit_log
