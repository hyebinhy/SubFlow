"""add email_verified to users

기존 사용자는 이미 쓰고 있던 계정이므로 True로 채운다(가입 흐름을 소급 적용하면
알림이 끊긴다). 이후 가입자는 모델 기본값 False로 들어온다.

Revision ID: b8e4f2a91c37
Revises: a7c1e5b9d2f4
Create Date: 2026-08-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8e4f2a91c37'
down_revision: Union[str, None] = 'a7c1e5b9d2f4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default='true'로 넣어 기존 행을 인증됨으로 채운 뒤,
    # 신규 가입자가 기본 미인증이 되도록 기본값을 떼어낸다.
    op.add_column(
        'users',
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column('users', 'email_verified', server_default=None)


def downgrade() -> None:
    op.drop_column('users', 'email_verified')
