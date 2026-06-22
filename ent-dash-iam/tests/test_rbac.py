import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_db
from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User

# Mock current user dependency
async def override_get_current_user():
    return User(id=999, email="admin@example.com", name="Admin User")

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_crud_permission(client: AsyncClient):
    # 1. Create Permission
    perm_data = {"name": "edit-posts", "description": "Can edit posts"}
    res = await client.post(f"{settings.API_V1_STR}/permissions", json=perm_data)
    assert res.status_code == 200
    perm = res.json()
    assert perm["name"] == "edit-posts"
    perm_id = perm["id"]

    # 2. List Permissions
    res = await client.get(f"{settings.API_V1_STR}/permissions")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 3. Update Permission
    res = await client.put(f"{settings.API_V1_STR}/permissions/{perm_id}", json={"name": "edit-all-posts", "description": "Can edit all posts"})
    assert res.status_code == 200
    assert res.json()["name"] == "edit-all-posts"

    # 4. Delete Permission
    res = await client.delete(f"{settings.API_V1_STR}/permissions/{perm_id}")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_crud_role(client: AsyncClient):
    # 1. Create Permission
    perm_res = await client.post(f"{settings.API_V1_STR}/permissions", json={"name": "manage-users"})
    perm_id = perm_res.json()["id"]

    # 2. Create Role with Permission
    role_data = {"name": "Admin", "permissions": [perm_id]}
    res = await client.post(f"{settings.API_V1_STR}/roles", json=role_data)
    assert res.status_code == 200
    role = res.json()
    assert role["name"] == "Admin"
    assert len(role["permissions"]) == 1
    role_id = role["id"]

    # 3. List Roles
    res = await client.get(f"{settings.API_V1_STR}/roles")
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 4. Update Role
    res = await client.put(f"{settings.API_V1_STR}/roles/{role_id}", json={"name": "Super Admin", "permissions": []})
    assert res.status_code == 200
    assert res.json()["name"] == "Super Admin"
    assert len(res.json()["permissions"]) == 0

    # 5. Delete Role
    res = await client.delete(f"{settings.API_V1_STR}/roles/{role_id}")
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_assign_roles_to_user(client: AsyncClient):
    # 1. Create a user
    user_data = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!"
    }
    res = await client.post(f"{settings.API_V1_STR}/users", json=user_data)
    assert res.status_code == 200
    user_id = res.json()["id"]

    # 2. Create a role
    role_res = await client.post(f"{settings.API_V1_STR}/roles", json={"name": "Editor"})
    role_id = role_res.json()["id"]

    # 3. Assign role to user
    res = await client.put(f"{settings.API_V1_STR}/users/{user_id}/roles", json={"role_ids": [role_id]})
    assert res.status_code == 200
    user_updated = res.json()
    
    assert len(user_updated["roles"]) == 1
    assert user_updated["roles"][0]["name"] == "Editor"
    
    # 4. Remove role from user
    res = await client.put(f"{settings.API_V1_STR}/users/{user_id}/roles", json={"role_ids": []})
    assert res.status_code == 200
    assert len(res.json()["roles"]) == 0
