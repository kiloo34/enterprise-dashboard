"""create fact_kinerjaprc table

Revision ID: 20250313_create_fact_kinerjaprc
Revises: 
Create Date: 2025-03-13

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '20250313_create_fact_kinerjaprc'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE SCHEMA IF NOT EXISTS "TABLEAU_REPORT"')
    op.execute("""
        CREATE TABLE "TABLEAU_REPORT".fact_kinerjaprc (
            periode_data date NULL,
            periode_laporan varchar(1) NULL,
            is_ajp bool NOT NULL,
            kelompok varchar(30) NULL,
            keterangan varchar(30) NULL,
            urut int4 NULL,
            jenis varchar(1) NULL,
            wil varchar(3) NULL,
            nama_wil varchar(30) NULL,
            cab varchar(3) NULL,
            nama_cab varchar(30) NULL,
            nominal numeric NULL,
            rasio numeric NULL
        )
    """)


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS "TABLEAU_REPORT".fact_kinerjaprc')
