"""
Unit tests for CRUDUser.

Covers:
- create() hashes password (raw password != stored value)
- get_by_email() finds correct record
- update() with new password re-hashes
- update() without password preserves existing hash
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_user import user as crud_user
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import verify_password


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_user_create(**kwargs) -> UserCreate:
    defaults = {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User",
        "position_id": None,
        "organization_unit_id": None,
        "direct_superior_id": None,
    }
    return UserCreate(**{**defaults, **kwargs})


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_hashes_password(db_session: AsyncSession):
    raw_password = "MySecret123!"
    user_in = _make_user_create(password=raw_password)
    user_obj = await crud_user.create(db_session, obj_in=user_in)

    # Password must be stored as hash, not plaintext
    assert user_obj.password != raw_password
    # Hash must verify against the original password
    assert verify_password(raw_password, user_obj.password) is True


@pytest.mark.asyncio
async def test_get_by_email_finds_user(db_session: AsyncSession):
    user_in = _make_user_create(email="find@test.com")
    await crud_user.create(db_session, obj_in=user_in)

    found = await crud_user.get_by_email(db_session, email="find@test.com")
    assert found is not None
    assert found.email == "find@test.com"


@pytest.mark.asyncio
async def test_get_by_email_returns_none_for_unknown(db_session: AsyncSession):
    result = await crud_user.get_by_email(db_session, email="nobody@nowhere.com")
    assert result is None


@pytest.mark.asyncio
async def test_update_password_rehashes(db_session: AsyncSession):
    user_in = _make_user_create(email="update@test.com", password="OldPass!")
    user_obj = await crud_user.create(db_session, obj_in=user_in)
    old_hash = user_obj.password

    new_password = "NewPass456!"
    updated = await crud_user.update(
        db_session, db_obj=user_obj, obj_in=UserUpdate(password=new_password)
    )

    # New hash must be different from the old one
    assert updated.password != old_hash
    # And must verify against the new password
    assert verify_password(new_password, updated.password) is True


@pytest.mark.asyncio
async def test_update_without_password_preserves_hash(db_session: AsyncSession):
    user_in = _make_user_create(email="preserve@test.com", password="Stable12!")
    user_obj = await crud_user.create(db_session, obj_in=user_in)
    original_hash = user_obj.password

    # Update only the name, no password field
    updated = await crud_user.update(
        db_session, db_obj=user_obj, obj_in={"name": "New Name"}
    )

    assert updated.name == "New Name"
    assert updated.password == original_hash


@pytest.mark.asyncio
async def test_create_multiple_users_unique_ids(db_session: AsyncSession):
    u1 = await crud_user.create(db_session, obj_in=_make_user_create(email="u1@test.com"))
    u2 = await crud_user.create(db_session, obj_in=_make_user_create(email="u2@test.com"))
    assert u1.id != u2.id
