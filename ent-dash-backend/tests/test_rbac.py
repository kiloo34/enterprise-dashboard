import pytest
from httpx import AsyncClient
from app.models.role_permission import Role
from app.db.session import get_db

# Use pytest-asyncio to run tests asynchronously
pytestmark = pytest.mark.asyncio

async def test_get_permissions_unauthorized(client: AsyncClient):
    # Act
    # Trying to access protected route without token
    response = await client.get("/api/permissions")

    # Assert
    assert response.status_code == 401
    assert response.json() == {
        "code": "HTTP_401",
        "message": "Not authenticated"
    }

async def test_delete_protected_role_error_format(client: AsyncClient):
    from app.main import app
    from app.api.deps import get_current_user
    from unittest.mock import MagicMock

    # Arrange Mock DB
    mock_session = MagicMock()
    class MockExecuteResult:
        def scalar_one_or_none(self): return Role(id=1, name="administrator", guard_name="web")
    async def mock_execute(*args, **kwargs):
        return MockExecuteResult()
    mock_session.execute = mock_execute

    async def override_get_db(): yield mock_session

    # Arrange Mock Auth User
    async def override_get_current_user(): return MagicMock(id=1)

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    # Act
    response = await client.delete("/api/roles/1")

    # Assert
    assert response.status_code == 400
    data = response.json()

    assert data == {
        "code": "DELETE_PROTECTED_ROLE",
        "message": "Cannot delete system administrator role"
    }

    app.dependency_overrides.clear()
