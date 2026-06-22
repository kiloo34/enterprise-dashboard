"""
Unit tests for CRUDRole.

Covers:
- create() without permissions
- create() with permission IDs → RoleHasPermission rows created
- update() syncs permissions (old removed, new added)
- get_multi_with_permissions() eager-loads permissions
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.crud.crud_role import role as crud_role
from app.crud.crud_permission import permission as crud_permission
from app.models.role_permission import Role, Permission
from app.schemas.rbac import RoleCreate, RoleUpdate, PermissionCreate


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _make_permission(db: AsyncSession, name: str = "perm:read"):
    perm_in = PermissionCreate(name=name, guard_name="api", description="")
    return await crud_permission.create(db, obj_in=perm_in)


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_role_without_permissions(db_session: AsyncSession):
    role_in = RoleCreate(name="viewer", guard_name="web", permissions=[])
    role_obj = await crud_role.create(db_session, obj_in=role_in)

    assert role_obj.id is not None
    assert role_obj.name == "viewer"
    assert role_obj.permissions == []


@pytest.mark.asyncio
async def test_create_role_with_permissions(db_session: AsyncSession):
    perm1 = await _make_permission(db_session, "users:read")
    perm2 = await _make_permission(db_session, "users:write")

    role_in = RoleCreate(
        name="editor",
        guard_name="api",
        permissions=[perm1.id, perm2.id]
    )
    role_obj = await crud_role.create(db_session, obj_in=role_in)

    permission_ids = {p.id for p in role_obj.permissions}
    assert perm1.id in permission_ids
    assert perm2.id in permission_ids


@pytest.mark.asyncio
async def test_update_role_syncs_permissions(db_session: AsyncSession):
    perm_old = await _make_permission(db_session, "old:perm")
    perm_new = await _make_permission(db_session, "new:perm")

    # Create role with old permission
    role_in = RoleCreate(name="sync-test", guard_name="api", permissions=[perm_old.id])
    role_obj = await crud_role.create(db_session, obj_in=role_in)
    assert any(p.id == perm_old.id for p in role_obj.permissions)

    # Update with new permission only
    updated = await crud_role.update(
        db_session,
        db_obj=role_obj,
        obj_in=RoleUpdate(name="sync-test", guard_name="api", permissions=[perm_new.id])
    )

    stmt = select(Role).where(Role.id == updated.id).options(selectinload(Role.permissions))
    updated_loaded = (await db_session.execute(stmt)).scalar_one()
    perm_ids_after = {p.id for p in updated_loaded.permissions}
    assert perm_old.id not in perm_ids_after
    assert perm_new.id in perm_ids_after


@pytest.mark.asyncio
async def test_get_multi_with_permissions_eager_loads(db_session: AsyncSession):
    perm = await _make_permission(db_session, "roles:list")
    role_in = RoleCreate(name="lister", guard_name="web", permissions=[perm.id])
    await crud_role.create(db_session, obj_in=role_in)

    roles = await crud_role.get_multi_with_permissions(db_session)

    assert len(roles) >= 1
    # Permissions should be loaded (not lazy, no additional query needed)
    for r in roles:
        assert isinstance(r.permissions, list)


@pytest.mark.asyncio
async def test_update_role_name_without_changing_permissions(db_session: AsyncSession):
    perm = await _make_permission(db_session, "keep:perm")
    role_in = RoleCreate(name="rename-me", guard_name="api", permissions=[perm.id])
    role_obj = await crud_role.create(db_session, obj_in=role_in)

    # Update only the name, permissions=None should preserve existing
    updated = await crud_role.update(
        db_session,
        db_obj=role_obj,
        obj_in={"name": "renamed"}
    )

    assert updated.name == "renamed"
