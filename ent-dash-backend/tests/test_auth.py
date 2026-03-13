import pytest
from httpx import AsyncClient
from unittest.mock import patch
from app.models.user import User

pytestmark = pytest.mark.asyncio

@pytest.fixture
def mock_user():
    return User(
        id=1,
        email="test@example.com",
        name="Test User"
    )

async def test_login_success(client: AsyncClient, mock_user):
    from app.main import app
    from app.db.session import get_db
    from unittest.mock import MagicMock

    # Create the mock DB session
    mock_session = MagicMock()

    class MockExecuteResult:
        def scalars(self):
            class MockScalars:
                def first(self): return None
                def all(self): return []
            return MockScalars()

    async def mock_execute(*args, **kwargs):
        return MockExecuteResult()

    mock_session.execute = mock_execute

    # Provide the override dependency
    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    # Arrange
    with patch("app.api.routes.auth.authenticate_user") as mock_auth:
        mock_auth.return_value = mock_user

        # Mock create_access_token explicitly to prevent any secret encoding issues
        with patch("app.api.routes.auth.create_access_token") as mock_token:
            mock_token.return_value = "mocked_jwt_token"

            # Act
            response = await client.post(
                "/api/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "testpass123"
                }
            )

            # Assert (Rule 12: Test behavior, single responsibility)
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["access_token"] == "mocked_jwt_token"
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == "test@example.com"
            assert data["user"]["name"] == "Test User"

    # Clean up
    app.dependency_overrides.clear()

async def test_login_invalid_credentials_format(client: AsyncClient):
    # Arrange - Mock authenticate_user to return None (simulating failure)
    with patch("app.api.routes.auth.authenticate_user") as mock_auth:
        mock_auth.return_value = None

        # Act
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword"
            }
        )

        # Assert (Rule 9: Check strict Exception JSON schema contract)
        assert response.status_code == 401
        data = response.json()

        # Must enforce exactly this format according to Unified Rule 9
        assert data == {
            "code": "INVALID_CREDENTIALS",
            "message": "Incorrect email or password"
        }

async def test_login_validation_error_format(client: AsyncClient):
    # Act - Missing password
    response = await client.post(
        "/api/auth/login",
        json={
            "email": "not-an-email"
        }
    )

    # Assert (Rule 9: Unified Pydantic Validation error structure)
    assert response.status_code == 422
    data = response.json()

    assert data["code"] == "VALIDATION_ERROR"
    assert "password" in data["details"]
