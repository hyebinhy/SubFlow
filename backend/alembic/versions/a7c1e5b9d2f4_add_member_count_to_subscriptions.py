"""add member_count to subscriptions (shared/family cost split)

Revision ID: a7c1e5b9d2f4
Revises: f3b88d0292a3
Create Date: 2026-07-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7c1e5b9d2f4'
down_revision: Union[str, None] = 'f3b88d0292a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'subscriptions',
        sa.Column('member_count', sa.Integer(), nullable=False, server_default=sa.text('1')),
    )


def downgrade() -> None:
    op.drop_column('subscriptions', 'member_count')
