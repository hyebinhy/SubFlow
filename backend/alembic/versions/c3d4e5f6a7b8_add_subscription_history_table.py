"""add subscription_history table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-03-27 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'subscription_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('old_value', sa.String(500), nullable=True),
        sa.Column('new_value', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_index('ix_subscription_history_subscription_id', 'subscription_history', ['subscription_id'])
    op.create_index('ix_subscription_history_user_id', 'subscription_history', ['user_id'])
    op.create_index('ix_subscription_history_created_at', 'subscription_history', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_subscription_history_created_at', table_name='subscription_history')
    op.drop_index('ix_subscription_history_user_id', table_name='subscription_history')
    op.drop_index('ix_subscription_history_subscription_id', table_name='subscription_history')
    op.drop_table('subscription_history')
