"""add user_id to categories and services

카테고리·서비스는 지금까지 전역 공유 테이블이었다. 누가 카테고리를 하나
만들면 모든 사용자의 드롭다운에 나타난다. user_id를 nullable로 붙여
NULL은 기본 카탈로그(시드), 값이 있으면 그 사람만 보는 항목으로 나눈다.

이름의 전역 UNIQUE도 함께 푼다. 그대로 두면 남이 "운동"을 만든 순간
다른 사람은 같은 이름을 못 쓴다. 대신 부분 유니크 인덱스 두 개로 나눈다.

Revision ID: c9f2a41b70de
Revises: b8e4f2a91c37
Create Date: 2026-08-27 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9f2a41b70de'
down_revision: Union[str, None] = 'b8e4f2a91c37'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_name_unique(table: str) -> None:
    """table.name에 걸린 전역 UNIQUE 제약을 이름을 몰라도 지운다.

    초기 마이그레이션이 sa.UniqueConstraint('name')으로 이름 없이 만들어서
    실제 제약 이름은 DB가 붙인 것(보통 <table>_name_key)이다. 환경마다
    다를 수 있으니 카탈로그에서 찾아 지운다.
    """
    op.execute(
        sa.text(
            f"""
            DO $$
            DECLARE v_conname text;
            BEGIN
                SELECT c.conname INTO v_conname
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
                WHERE t.relname = '{table}'
                  AND c.contype = 'u'
                  AND array_length(c.conkey, 1) = 1
                  AND a.attname = 'name'
                LIMIT 1;

                IF v_conname IS NOT NULL THEN
                    EXECUTE format('ALTER TABLE {table} DROP CONSTRAINT %I', v_conname);
                END IF;
            END $$;
            """
        )
    )


def upgrade() -> None:
    for table in ('categories', 'services'):
        op.add_column(table, sa.Column('user_id', sa.UUID(), nullable=True))
        op.create_foreign_key(
            f'fk_{table}_user_id_users', table, 'users', ['user_id'], ['id']
        )
        op.create_index(f'ix_{table}_user_id', table, ['user_id'], unique=False)
        _drop_name_unique(table)

    op.create_index(
        'ux_categories_default_name', 'categories', ['name'],
        unique=True, postgresql_where=sa.text('user_id IS NULL'),
    )
    op.create_index(
        'ux_categories_user_name', 'categories', ['user_id', 'name'],
        unique=True, postgresql_where=sa.text('user_id IS NOT NULL'),
    )
    op.create_index(
        'ux_services_default_name', 'services', ['name'],
        unique=True, postgresql_where=sa.text('user_id IS NULL'),
    )
    op.create_index(
        'ux_services_user_name', 'services', ['user_id', 'name'],
        unique=True, postgresql_where=sa.text('user_id IS NOT NULL'),
    )


def downgrade() -> None:
    # 되돌리면 사용자가 만든 항목은 전역 카탈로그로 섞이게 된다. 이름이 겹치면
    # UNIQUE를 다시 걸 수 없으므로 사용자 항목을 먼저 지운다.
    op.execute("DELETE FROM service_plans WHERE service_id IN (SELECT id FROM services WHERE user_id IS NOT NULL)")
    op.execute("UPDATE subscriptions SET service_id = NULL WHERE service_id IN (SELECT id FROM services WHERE user_id IS NOT NULL)")
    op.execute("DELETE FROM services WHERE user_id IS NOT NULL")
    op.execute("UPDATE subscriptions SET category_id = NULL WHERE category_id IN (SELECT id FROM categories WHERE user_id IS NOT NULL)")
    op.execute("DELETE FROM categories WHERE user_id IS NOT NULL")

    for name in ('ux_services_user_name', 'ux_services_default_name',
                 'ux_categories_user_name', 'ux_categories_default_name'):
        op.drop_index(name)

    for table in ('categories', 'services'):
        op.create_unique_constraint(f'{table}_name_key', table, ['name'])
        op.drop_index(f'ix_{table}_user_id', table_name=table)
        op.drop_constraint(f'fk_{table}_user_id_users', table, type_='foreignkey')
        op.drop_column(table, 'user_id')
