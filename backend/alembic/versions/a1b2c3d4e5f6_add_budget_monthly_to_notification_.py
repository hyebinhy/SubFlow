"""add budget_monthly to notification_settings

Revision ID: a1b2c3d4e5f6
Revises: e7d93653a653
Create Date: 2026-03-26 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e7d93653a653'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('notification_settings', sa.Column('budget_monthly', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('notification_settings', 'budget_monthly')
