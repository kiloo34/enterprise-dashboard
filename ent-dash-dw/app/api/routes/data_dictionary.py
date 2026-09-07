from fastapi import APIRouter, Depends, HTTPException
from typing import Any

from app.api.deps import get_current_user_payload
from app.services.data_dictionary import DataDictionaryService

router = APIRouter()

@router.get("/schemas")
async def get_schemas(
    _: dict = Depends(get_current_user_payload),
) -> list[str]:
    """Get all non-system schemas from the database."""
    try:
        return await DataDictionaryService.get_schemas()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{schema}/tables")
async def get_tables(
    schema: str,
    _: dict = Depends(get_current_user_payload),
) -> list[str]:
    """Get all tables in a specific schema."""
    try:
        return await DataDictionaryService.get_tables(schema)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{schema}/tables/{table_name}/columns")
async def get_table_columns(
    schema: str,
    table_name: str,
    _: dict = Depends(get_current_user_payload),
) -> list[dict[str, Any]]:
    """Get column details for a specific table."""
    try:
        return await DataDictionaryService.get_table_columns(schema, table_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
