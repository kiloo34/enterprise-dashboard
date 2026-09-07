import logging
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any

from app.db.session import engine

logger = logging.getLogger(__name__)

class DataDictionaryService:
    """Service to introspect database schemas dynamically using SQLAlchemy."""

    @staticmethod
    async def get_schemas() -> List[str]:
        """Fetch all non-system schema names."""
        async with engine.connect() as conn:
            def sync_get_schemas(connection):
                inspector = inspect(connection)
                schemas = inspector.get_schema_names()
                # Filter out postgres system schemas
                system_schemas = {"pg_catalog", "information_schema", "pg_toast"}
                return [s for s in schemas if s not in system_schemas and not s.startswith("pg_temp")]
            return await conn.run_sync(sync_get_schemas)

    @staticmethod
    async def get_tables(schema: str) -> List[str]:
        """Fetch all table names within a specific schema."""
        async with engine.connect() as conn:
            def sync_get_tables(connection):
                inspector = inspect(connection)
                return inspector.get_table_names(schema=schema)
            try:
                return await conn.run_sync(sync_get_tables)
            except Exception as e:
                logger.error(f"[DataDictionary] Failed to get tables for schema {schema}: {e}")
                raise ValueError(f"Failed to inspect schema {schema}")

    @staticmethod
    async def get_table_columns(schema: str, table_name: str) -> List[Dict[str, Any]]:
        """Fetch column details for a specific table."""
        async with engine.connect() as conn:
            def sync_get_cols(connection):
                inspector = inspect(connection)
                pk_constraint = inspector.get_pk_constraint(table_name, schema=schema)
                pk_columns = pk_constraint.get("constrained_columns", []) if pk_constraint else []
                
                columns = inspector.get_columns(table_name, schema=schema)
                
                formatted_cols = []
                for col in columns:
                    formatted_cols.append({
                        "name": col["name"],
                        "type": str(col["type"]),
                        "nullable": col["nullable"],
                        "default": str(col["default"]) if col["default"] is not None else None,
                        "primary_key": col["name"] in pk_columns
                    })
                return formatted_cols
            
            try:
                return await conn.run_sync(sync_get_cols)
            except Exception as e:
                logger.error(f"[DataDictionary] Failed to get columns for {schema}.{table_name}: {e}")
                raise ValueError(f"Failed to inspect table {schema}.{table_name}")
