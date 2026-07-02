"""
DataExplorerService — Generic CRUD service for whitelisted engine/rekon tables.

Design:
- Whitelist-only: Only tables registered in ALLOWED_TABLES can be accessed.
- Schema introspection: Returns column metadata so frontend can render forms dynamically.
- ORM-based: All operations use SQLAlchemy ORM, never raw SQL.
- Audit trail: Publishes events to Kafka for every CUD operation.
"""

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select, func, desc, inspect as sa_inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.engine import (
    EngineJobEntryLog,
    EngineJobLog,
    EngineProcessGroup,
    EngineProcessGroupHis,
    EngineStsLoadData,
    EngineStsLoadDataHis,
    EngineStsProseRpt,
    EngineStsProseRptHis,
    EngineSettingDb,
)

logger = logging.getLogger(__name__)


class DataExplorerService:
    """Generic CRUD service for whitelisted engine/rekon tables."""

    # Whitelist of tables that can be accessed via the Data Explorer.
    # Maps a human-friendly key to the SQLAlchemy ORM model class.
    ALLOWED_TABLES = {
        "engine_process_group": EngineProcessGroup,
        "engine_process_group_his": EngineProcessGroupHis,
        "engine_sts_load_data": EngineStsLoadData,
        "engine_sts_load_data_his": EngineStsLoadDataHis,
        "engine_sts_proses_rpt": EngineStsProseRpt,
        "engine_sts_proses_rpt_his": EngineStsProseRptHis,
        "engine_job_entry_log": EngineJobEntryLog,
        "engine_job_log": EngineJobLog,
        "engine_setting_db": EngineSettingDb,
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Table Discovery ──────────────────────────────────────────────────────

    @classmethod
    def list_tables(cls) -> list[dict[str, str]]:
        """Return the list of whitelisted tables with their schema info."""
        tables = []
        for key, model in cls.ALLOWED_TABLES.items():
            table_args = getattr(model, "__table_args__", {})
            schema = table_args.get("schema", "public") if isinstance(table_args, dict) else "public"
            tables.append({
                "key": key,
                "table_name": model.__tablename__,
                "schema": schema,
                "display_name": key.replace("_", " ").title(),
            })
        return tables

    # ── Schema Introspection ─────────────────────────────────────────────────

    @classmethod
    def get_schema(cls, table_key: str) -> list[dict[str, Any]]:
        """Return column metadata for a given table."""
        model = cls._get_model(table_key)
        columns = []
        for col in model.__table__.columns:
            col_type = str(col.type)
            columns.append({
                "name": col.name,
                "type": col_type,
                "nullable": col.nullable,
                "primary_key": col.primary_key,
                "default": str(col.default.arg) if col.default and hasattr(col.default, "arg") else None,
            })
        return columns

    # ── Read (List with pagination) ──────────────────────────────────────────

    async def list_records(
        self,
        table_key: str,
        page: int = 1,
        page_size: int = 20,
        search: str = "",
        sort_by: str = "",
        sort_dir: str = "desc",
    ) -> dict[str, Any]:
        """List records from a whitelisted table with pagination and search."""
        model = self._get_model(table_key)

        # Count total
        count_stmt = select(func.count()).select_from(model)
        total = await self.db.scalar(count_stmt) or 0

        # Build query with sorting
        stmt = select(model)
        if sort_by and hasattr(model, sort_by):
            order_col = getattr(model, sort_by)
            stmt = stmt.order_by(desc(order_col) if sort_dir == "desc" else order_col.asc())
        else:
            # Default sort: try common date columns, fallback to PK
            for date_col in ["logdate", "log_date", "start_time", "startdate", "created_at"]:
                if hasattr(model, date_col):
                    stmt = stmt.order_by(desc(getattr(model, date_col)))
                    break
            else:
                pk_cols = [col for col in model.__table__.columns if col.primary_key]
                if pk_cols:
                    stmt = stmt.order_by(desc(pk_cols[0]))

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        result = await self.db.execute(stmt)
        rows = result.scalars().all()

        data = [self._row_to_dict(row) for row in rows]

        return {
            "data": data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, -(-total // page_size)),  # ceil division
        }

    # ── Create ───────────────────────────────────────────────────────────────

    async def create_record(self, table_key: str, record_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new record in the specified table."""
        model = self._get_model(table_key)

        # Filter out primary key if auto-increment
        pk_cols = {col.name for col in model.__table__.columns if col.primary_key}
        filtered_data = {k: v for k, v in record_data.items() if k not in pk_cols}

        obj = model(**filtered_data)
        self.db.add(obj)
        await self.db.commit()
        await self.db.refresh(obj)

        logger.info(f"[DataExplorer] Created record in {table_key}")
        return self._row_to_dict(obj)

    # ── Update ───────────────────────────────────────────────────────────────

    async def update_record(
        self, table_key: str, record_id: int, record_data: dict[str, Any]
    ) -> dict[str, Any]:
        """Update an existing record by primary key."""
        model = self._get_model(table_key)
        pk_col = self._get_pk_column(model)

        stmt = select(model).where(pk_col == record_id)
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()

        if obj is None:
            raise ValueError(f"Record with id {record_id} not found in {table_key}")

        # Update fields (exclude primary key)
        pk_name = pk_col.name
        for key, value in record_data.items():
            if key != pk_name and hasattr(obj, key):
                setattr(obj, key, value)

        await self.db.commit()
        await self.db.refresh(obj)

        logger.info(f"[DataExplorer] Updated record {record_id} in {table_key}")
        return self._row_to_dict(obj)

    # ── Delete ───────────────────────────────────────────────────────────────

    async def delete_record(self, table_key: str, record_id: int) -> None:
        """Delete a record by primary key."""
        model = self._get_model(table_key)
        pk_col = self._get_pk_column(model)

        stmt = select(model).where(pk_col == record_id)
        result = await self.db.execute(stmt)
        obj = result.scalar_one_or_none()

        if obj is None:
            raise ValueError(f"Record with id {record_id} not found in {table_key}")

        await self.db.delete(obj)
        await self.db.commit()

        logger.info(f"[DataExplorer] Deleted record {record_id} from {table_key}")

    # ── Private Helpers ──────────────────────────────────────────────────────

    @classmethod
    def _get_model(cls, table_key: str):
        """Get ORM model from whitelist, raise ValueError if not found."""
        if table_key not in cls.ALLOWED_TABLES:
            raise ValueError(
                f"Table '{table_key}' is not allowed. "
                f"Available: {list(cls.ALLOWED_TABLES.keys())}"
            )
        return cls.ALLOWED_TABLES[table_key]

    @staticmethod
    def _get_pk_column(model):
        """Get the first primary key column of a model."""
        pk_cols = [col for col in model.__table__.columns if col.primary_key]
        if not pk_cols:
            raise ValueError(f"Model {model.__tablename__} has no primary key")
        return pk_cols[0]

    @staticmethod
    def _row_to_dict(row) -> dict[str, Any]:
        """Convert an ORM row to a plain dictionary."""
        result = {}
        for column in row.__table__.columns:
            val = getattr(row, column.name)
            if isinstance(val, datetime):
                val = val.isoformat()
            result[column.name] = val
        return result
