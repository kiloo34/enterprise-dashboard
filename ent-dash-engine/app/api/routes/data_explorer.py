"""
Data Explorer API Routes — Generic CRUD endpoints for whitelisted tables.

All endpoints are protected by JWT authentication.
Write operations (create, update, delete) require specific permissions.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.api.deps import get_current_user_payload, require_engine_permission
from app.services.data_explorer import DataExplorerService

router = APIRouter()


@router.get("/tables")
async def list_available_tables(
    _: dict = Depends(get_current_user_payload),
) -> list[dict[str, str]]:
    """Return the list of whitelisted tables accessible via Data Explorer."""
    return DataExplorerService.list_tables()


@router.get("/{table_key}/schema")
async def get_table_schema(
    table_key: str,
    _: dict = Depends(get_current_user_payload),
) -> list[dict[str, Any]]:
    """Return column metadata for the specified table."""
    try:
        return DataExplorerService.get_schema(table_key)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{table_key}")
async def list_records(
    table_key: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    search: str = Query("", description="Search text"),
    sort_by: str = Query("", description="Column to sort by"),
    sort_dir: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(get_current_user_payload),
) -> dict[str, Any]:
    """List records with pagination from a whitelisted table."""
    service = DataExplorerService(db)
    try:
        return await service.list_records(
            table_key=table_key,
            page=page,
            page_size=page_size,
            search=search,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{table_key}", status_code=201)
async def create_record(
    table_key: str,
    record_data: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> dict[str, Any]:
    """Create a new record in the specified table. Requires data_explorer:write permission."""
    service = DataExplorerService(db)
    try:
        result = await service.create_record(table_key, record_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create record: {str(e)}")


@router.put("/{table_key}/{record_id}")
async def update_record(
    table_key: str,
    record_id: int,
    record_data: dict[str, Any],
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> dict[str, Any]:
    """Update an existing record. Requires data_explorer:write permission."""
    service = DataExplorerService(db)
    try:
        result = await service.update_record(table_key, record_id, record_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update record: {str(e)}")


@router.delete("/{table_key}/{record_id}", status_code=204)
async def delete_record(
    table_key: str,
    record_id: int,
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
) -> None:
    """Delete a record. Requires data_explorer:delete permission."""
    service = DataExplorerService(db)
    try:
        await service.delete_record(table_key, record_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete record: {str(e)}")
