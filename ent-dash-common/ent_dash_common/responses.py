"""
Standard API response schemas for all services.

Ensures a consistent response contract across the entire platform.
All API responses should wrap their data in one of these schemas.

Success:  { "success": true, "data": {...} }
Error:    { "code": "...", "message": "..." }  ← handled by exception handlers
Paginated: { "success": true, "data": [...], "meta": { "total": N, "page": P, "per_page": PP } }
"""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success wrapper for single-item responses."""
    success: bool = True
    data: T


class PaginatedMeta(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard success wrapper for paginated list responses."""
    success: bool = True
    data: List[T]
    meta: PaginatedMeta


class HealthResponse(BaseModel):
    """Health check response — used by all services at GET /health."""
    service: str
    status: str
    version: Optional[str] = None

    @classmethod
    def healthy(cls, service_name: str, version: str = "1.0.0") -> "HealthResponse":
        return cls(service=service_name, status="healthy", version=version)
