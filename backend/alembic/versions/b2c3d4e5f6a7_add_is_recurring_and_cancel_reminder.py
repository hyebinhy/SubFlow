"""add is_recurring and cancel_reminder to subscriptions

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-26 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    op.add_column('subscriptions', sa.Column('cancel_reminder', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('subscriptions', 'cancel_reminder')
    op.drop_column('subscriptions', 'is_recurring')
