from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class AppException(Exception):
    """
    Base exception for all application-level errors.
    Ensures that all raised exceptions conform to the strict JSON response rule.
    """
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None
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
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None, code: str = "VALIDATION_ERROR"):
        super().__init__(code=code, message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)


def setup_exception_handlers(app):
    """
    Registers global exception handlers for the FastAPI application to ensure
    all API responses adhere to the standard JSON contract:
    { "code": "...", "message": "..." }
    """

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        content = {
            "code": exc.code,
            "message": exc.message
        }
        if exc.details:
            content["details"] = exc.details

        return JSONResponse(
            status_code=exc.status_code,
            content=content,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format Pydantic validation errors nicely
        errors = {}
        for error in exc.errors():
            field = ".".join(str(x) for x in error["loc"] if x != "body")
            if not field:
                field = "body"
            errors[field] = error["msg"]

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "VALIDATION_ERROR",
                "message": "Terjadi kesalahan validasi pada data yang dikirim.",
                "details": errors
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # Default fallback for standard HTTPExceptions (like 404 router not found)
        # Attempt to extract if it's already formatting as dict
        if isinstance(exc.detail, dict) and "code" in exc.detail:
            content = exc.detail
        else:
            content = {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail)
            }

        return JSONResponse(
            status_code=exc.status_code,
            content=content,
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        # Critical rule: Do NOT expose raw exception strings to the client in production!
        import traceback
        import logging
        logging.error(f"Unhandled system exception at {request.method} {request.url}: {exc}\n{traceback.format_exc()}")

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Terjadi kesalahan internal pada server. Tim teknis telah dinotifikasi."
            },
        )
