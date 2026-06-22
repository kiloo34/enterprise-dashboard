import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session):
    user = User(id=1, email="test@example.com", name="Test User", password=get_password_hash("password123"))
    db_session.add(user)
    await db_session.commit()
    
    response = await client.post(f"{settings.API_V1_STR}/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient, db_session):
    user = User(id=2, email="test2@example.com", name="Test User", password=get_password_hash("password123"))
    db_session.add(user)
    await db_session.commit()
    
    response = await client.post(f"{settings.API_V1_STR}/auth/login", json={
        "email": "test2@example.com",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["message"]

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session):
    user = User(id=3, email="refresh@example.com", name="Test User", password=get_password_hash("password123"))
    db_session.add(user)
    await db_session.commit()
    
    login_response = await client.post(f"{settings.API_V1_STR}/auth/login", json={
        "email": "refresh@example.com",
        "password": "password123"
    })
    
    refresh_cookie = login_response.cookies.get("refresh_token")
    assert refresh_cookie is not None
    
    client.cookies.set("refresh_token", refresh_cookie)
    refresh_response = await client.post(f"{settings.API_V1_STR}/auth/refresh")
    
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data
    assert refresh_response.cookies.get("refresh_token") is not None

@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    client.cookies.set("refresh_token", "dummy_token")
    response = await client.post(f"{settings.API_V1_STR}/auth/logout")
    
    assert response.status_code == 200
    # On logout, httpx will see the cookie cleared
    cookie_val = response.cookies.get("refresh_token")
    assert not cookie_val
