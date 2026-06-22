import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import get_db
from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.role_permission import Role

async def override_get_current_user():
    admin_role = Role(id=1, name="Super Admin", permissions=[])
    user = User(id=999, email="admin@example.com", name="Admin User")
    user.roles = [admin_role]
    return user

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
async def test_create_and_get_position(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/positions",
        json={"name": "Software Engineer", "level": 3, "is_active": True}
    )
    assert response.status_code == 201
    pos_id = response.json()["id"]

    response = await client.get(f"{settings.API_V1_STR}/positions")
    assert response.status_code == 200
    positions = response.json()
    assert any(p["id"] == pos_id and p["name"] == "Software Engineer" for p in positions)

@pytest.mark.asyncio
async def test_create_and_get_org_unit(client: AsyncClient):
    response = await client.post(
        f"{settings.API_V1_STR}/organization-units",
        json={"name": "Engineering", "pluck_code": "ENG", "type": "Division"}
    )
    assert response.status_code == 201
    org_id = response.json()["id"]

    response = await client.get(f"{settings.API_V1_STR}/organization-units")
    assert response.status_code == 200
    orgs = response.json()
    assert any(o["id"] == org_id and o["pluck_code"] == "ENG" for o in orgs)

@pytest.mark.asyncio
async def test_update_position(client: AsyncClient):
    # Create
    res_create = await client.post(
        f"{settings.API_V1_STR}/positions",
        json={"name": "Manager", "level": 4}
    )
    pos_id = res_create.json()["id"]

    # Update
    res_update = await client.patch(
        f"{settings.API_V1_STR}/positions/{pos_id}",
        json={"name": "Senior Manager"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Senior Manager"

@pytest.mark.asyncio
async def test_user_creation_with_position_and_org(client: AsyncClient):
    # Create Position
    res_pos = await client.post(
        f"{settings.API_V1_STR}/positions",
        json={"name": "Developer", "level": 2}
    )
    pos_id = res_pos.json()["id"]

    # Create Org Unit
    res_org = await client.post(
        f"{settings.API_V1_STR}/organization-units",
        json={"name": "Backend Team", "pluck_code": "BE", "type": "Department"}
    )
    org_id = res_org.json()["id"]

    # Create User with pos_id and org_id
    user_data = {
        "name": "Integration User",
        "email": "integration@example.com",
        "password": "password123",
        "position_id": pos_id,
        "organization_unit_id": org_id
    }
    
    res_user = await client.post(f"{settings.API_V1_STR}/users", json=user_data)
    assert res_user.status_code == 200
    user_id = res_user.json()["id"]

    # Verify relationships
    res_get_user = await client.get(f"{settings.API_V1_STR}/users/{user_id}")
    assert res_get_user.status_code == 200
    data = res_get_user.json()
    assert data["position"]["id"] == pos_id
    assert data["position"]["name"] == "Developer"
    assert data["organization_unit"]["id"] == org_id
    assert data["organization_unit"]["pluck_code"] == "BE"

@pytest.mark.asyncio
async def test_org_unit_hierarchy(client: AsyncClient):
    # Create Parent Org
    res_parent = await client.post(
        f"{settings.API_V1_STR}/organization-units",
        json={"name": "Head Office", "pluck_code": "HO", "type": "HQ"}
    )
    parent_id = res_parent.json()["id"]

    # Create Child Org
    res_child = await client.post(
        f"{settings.API_V1_STR}/organization-units",
        json={"name": "Branch Office", "pluck_code": "BO1", "type": "Branch", "parent_id": parent_id}
    )
    assert res_child.status_code == 201

    # Fetch Tree
    res_tree = await client.get(f"{settings.API_V1_STR}/organization-units/tree")
    assert res_tree.status_code == 200
    tree = res_tree.json()
    
    # Assert hierarchy
    ho_node = next((n for n in tree if n["pluck_code"] == "HO"), None)
    assert ho_node is not None
    assert len(ho_node["children"]) >= 1
    bo_node = next((n for n in ho_node["children"] if n["pluck_code"] == "BO1"), None)
    assert bo_node is not None
    assert bo_node["parent_id"] == parent_id
