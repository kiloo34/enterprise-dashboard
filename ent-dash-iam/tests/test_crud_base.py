"""
Unit tests for CRUDBase generic CRUD operations.

Uses a lightweight "Item" model defined locally so these tests
are decoupled from real domain models.
"""
import pytest
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base_class import Base
from app.crud.base import CRUDBase


# ── Minimal in-test model & schemas ───────────────────────────────────────────

class Item(Base):
    __tablename__ = "test_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)


class ItemCreate(BaseModel):
    name: str


class ItemUpdate(BaseModel):
    name: str


item_crud = CRUDBase[Item, ItemCreate, ItemUpdate](Item)


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_returns_object(db_session: AsyncSession):
    obj = await item_crud.create(db_session, obj_in=ItemCreate(name="Alpha"))
    assert obj.id is not None
    assert obj.name == "Alpha"


@pytest.mark.asyncio
async def test_get_returns_created_object(db_session: AsyncSession):
    created = await item_crud.create(db_session, obj_in=ItemCreate(name="Beta"))
    fetched = await item_crud.get(db_session, created.id)
    assert fetched is not None
    assert fetched.id == created.id
    assert fetched.name == "Beta"


@pytest.mark.asyncio
async def test_get_returns_none_for_unknown_id(db_session: AsyncSession):
    result = await item_crud.get(db_session, 99999)
    assert result is None


@pytest.mark.asyncio
async def test_get_multi_returns_all(db_session: AsyncSession):
    await item_crud.create(db_session, obj_in=ItemCreate(name="C1"))
    await item_crud.create(db_session, obj_in=ItemCreate(name="C2"))
    await item_crud.create(db_session, obj_in=ItemCreate(name="C3"))
    items = await item_crud.get_multi(db_session)
    assert len(items) == 3


@pytest.mark.asyncio
async def test_get_multi_skip_and_limit(db_session: AsyncSession):
    for i in range(5):
        await item_crud.create(db_session, obj_in=ItemCreate(name=f"Item{i}"))
    page = await item_crud.get_multi(db_session, skip=2, limit=2)
    assert len(page) == 2


@pytest.mark.asyncio
async def test_update_with_schema(db_session: AsyncSession):
    obj = await item_crud.create(db_session, obj_in=ItemCreate(name="OldName"))
    updated = await item_crud.update(db_session, db_obj=obj, obj_in=ItemUpdate(name="NewName"))
    assert updated.name == "NewName"
    assert updated.id == obj.id


@pytest.mark.asyncio
async def test_update_with_dict(db_session: AsyncSession):
    obj = await item_crud.create(db_session, obj_in=ItemCreate(name="OriginalName"))
    updated = await item_crud.update(db_session, db_obj=obj, obj_in={"name": "DictUpdate"})
    assert updated.name == "DictUpdate"


@pytest.mark.asyncio
async def test_remove_deletes_object(db_session: AsyncSession):
    obj = await item_crud.create(db_session, obj_in=ItemCreate(name="ToDelete"))
    removed = await item_crud.remove(db_session, id=obj.id)
    assert removed is not None
    assert removed.id == obj.id
    # Verify it no longer exists
    fetched = await item_crud.get(db_session, obj.id)
    assert fetched is None


@pytest.mark.asyncio
async def test_remove_nonexistent_returns_none(db_session: AsyncSession):
    result = await item_crud.remove(db_session, id=99999)
    assert result is None
