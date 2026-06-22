import time
import uuid
import logging
import json
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from jose import jwt, JWTError
from app.core.config import settings

logger = logging.getLogger("iam.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Structured JSON access log middleware.

    Per-request fields logged:
      - request_id  : UUID for distributed tracing
      - method      : HTTP verb
      - path        : Request path
      - status_code : Response status
      - latency_ms  : Processing time in milliseconds
      - user_email  : Extracted from JWT (if present and valid)
      - timestamp   : ISO-8601 UTC
    """

    SKIP_PATHS = {"/health", "/metrics", "/favicon.ico"}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip noisy health/metrics endpoints
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        request_id = str(uuid.uuid4())
        # Make request_id available downstream via state
        request.state.request_id = request_id

        user_email = self._extract_user(request)
        start_time = time.perf_counter()

        response = await call_next(request)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        log_record = {
            "request_id": request_id,
            "method": request.method,
            "path": str(request.url.path),
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "user_email": user_email,
        }

        # Choose log level based on status code
        if response.status_code >= 500:
            logger.error(json.dumps(log_record))
        elif response.status_code >= 400:
            logger.warning(json.dumps(log_record))
        else:
            logger.info(json.dumps(log_record))

        # Propagate request_id in response header for client-side tracing
        response.headers["X-Request-ID"] = request_id
        return response

    def _extract_user(self, request: Request) -> str | None:
        """Decode JWT from Authorization header without raising on failure."""
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_exp": False},  # already verified by route dependencies
            )
            return payload.get("sub")
        except (JWTError, Exception):
            return None
