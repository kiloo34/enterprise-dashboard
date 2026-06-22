from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: int | None,
        action: str,
        target_type: str,
        target_id: str | None = None,
        details: dict | None = None,
        request: Request | None = None
    ) -> AuditLog:
        """
        Creates an audit log entry for a specific action, extracting forensic data if request is provided.
        """
        ip_address = None
        user_agent = None
        endpoint = None
        method = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            endpoint = request.url.path
            method = request.method

        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            endpoint=endpoint,
            method=method
        )
        db.add(audit_log)
        await db.commit()
        await db.refresh(audit_log)
        return audit_log
