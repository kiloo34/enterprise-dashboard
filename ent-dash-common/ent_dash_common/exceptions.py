"""
Standardized exception hierarchy for all Enterprise Dashboard services.

All services raise and handle these exceptions in the same way,
ensuring a consistent JSON error contract across the entire system:
  { "code": "...", "message": "...", "details": {...} }
"""
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


class AppException(Exception):
    """Base exception — all service-level errors derive from this."""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND"):
        super().__init__(code=code, message=message, status_code=status.HTTP_404_NOT_FOUND)


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Unauthorized access", code: str = "UNAUTHORIZED"):
        super().__init__(code=code, message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden", code: str = "FORBIDDEN"):
        super().__init__(code=code, message=message, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(AppException):
    def __init__(
        self,
        message: str = "Validation failed",
        details: Optional[Dict[str, Any]] = None,
        code: str = "VALIDATION_ERROR",
    ):
        super().__init__(
            code=code,
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", code: str = "CONFLICT"):
        super().__init__(code=code, message=message, status_code=status.HTTP_409_CONFLICT)


def setup_exception_handlers(app) -> None:
    """
    Register global exception handlers on a FastAPI app instance.
    Call this once in each service's `create_app()`.

    Usage:
        from ent_dash_common.exceptions import setup_exception_handlers
        setup_exception_handlers(app)
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        content: Dict[str, Any] = {"code": exc.code, "message": exc.message}
        if exc.details:
            content["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        errors: Dict[str, str] = {}
        for error in exc.errors():
            field = ".".join(str(x) for x in error["loc"] if x != "body")
            errors[field or "body"] = error["msg"]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "VALIDATION_ERROR",
                "message": "Terjadi kesalahan validasi pada data yang dikirim.",
                "details": errors,
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = exc.detail
        else:
            content = {"code": f"HTTP_{exc.status_code}", "message": str(exc.detail)}
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        import traceback
        import logging
        logging.error(
            f"Unhandled exception at {request.method} {request.url}: {exc}\n{traceback.format_exc()}"
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Terjadi kesalahan internal pada server. Tim teknis telah dinotifikasi.",
            },
        )
