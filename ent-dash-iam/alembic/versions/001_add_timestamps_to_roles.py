"""add created_at and updated_at to roles

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use raw SQL with IF NOT EXISTS to be idempotent even if columns were added manually
    op.execute("ALTER TABLE app.roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()")
    op.execute("ALTER TABLE app.roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()")


def downgrade() -> None:
    op.drop_column("roles", "updated_at", schema="app")
    op.drop_column("roles", "created_at", schema="app")
