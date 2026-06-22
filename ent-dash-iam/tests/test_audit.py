import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_db
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash
from app.models.audit_log import AuditLog
from app.api.deps import get_current_user

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_audit_logs(client: AsyncClient, db_session):
    user = User(id=100, email="audit_admin@example.com", name="Audit Admin", password=get_password_hash("pass"))
    db_session.add(user)
    
    log1 = AuditLog(user_id=100, action="TEST_ACTION", target_type="Test")
    db_session.add(log1)
    await db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    response = await client.get(f"{settings.API_V1_STR}/audit-logs")
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) >= 1
    assert any(item["action"] == "TEST_ACTION" for item in data)
    
    app.dependency_overrides.pop(get_current_user, None)
