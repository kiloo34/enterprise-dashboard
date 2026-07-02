"""
Tests for the Data Explorer CRUD service and API routes.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.data_explorer import DataExplorerService


class TestDataExplorerService:
    """Unit tests for DataExplorerService class."""

    def test_list_tables_returns_all_whitelisted(self):
        """Verify that list_tables returns all 9 whitelisted tables."""
        tables = DataExplorerService.list_tables()
        assert len(tables) == 9
        keys = [t["key"] for t in tables]
        assert "engine_process_group" in keys
        assert "engine_job_log" in keys
        assert "engine_setting_db" in keys

    def test_list_tables_has_required_fields(self):
        """Verify each table entry has key, table_name, schema, display_name."""
        tables = DataExplorerService.list_tables()
        for table in tables:
            assert "key" in table
            assert "table_name" in table
            assert "schema" in table
            assert "display_name" in table

    def test_get_schema_returns_columns(self):
        """Verify schema introspection returns column metadata."""
        schema = DataExplorerService.get_schema("engine_process_group")
        assert len(schema) > 0
        col_names = [c["name"] for c in schema]
        assert "id" in col_names
        assert "group_name" in col_names

    def test_get_schema_includes_type_info(self):
        """Verify each column has type, nullable, and primary_key info."""
        schema = DataExplorerService.get_schema("engine_process_group")
        for col in schema:
            assert "name" in col
            assert "type" in col
            assert "nullable" in col
            assert "primary_key" in col

    def test_get_schema_rejects_unknown_table(self):
        """Verify that requesting schema for an unknown table raises ValueError."""
        with pytest.raises(ValueError, match="not allowed"):
            DataExplorerService.get_schema("evil_table; DROP TABLE")

    def test_get_model_rejects_injection(self):
        """Verify the whitelist blocks SQL injection attempts."""
        with pytest.raises(ValueError, match="not allowed"):
            DataExplorerService._get_model("users; DROP TABLE app.users")

    def test_get_schema_pk_detection(self):
        """Verify primary key detection works."""
        schema = DataExplorerService.get_schema("engine_job_log")
        pk_cols = [c for c in schema if c["primary_key"]]
        assert len(pk_cols) >= 1
        assert pk_cols[0]["name"] == "id_job"

    def test_display_name_formatting(self):
        """Verify display_name is human-readable."""
        tables = DataExplorerService.list_tables()
        epg = next(t for t in tables if t["key"] == "engine_process_group")
        assert epg["display_name"] == "Engine Process Group"

    def test_all_tables_have_rekon_schema(self):
        """Verify all whitelisted tables are in the 'rekon' schema."""
        tables = DataExplorerService.list_tables()
        for table in tables:
            assert table["schema"] == "rekon", f"{table['key']} should be in rekon schema"
