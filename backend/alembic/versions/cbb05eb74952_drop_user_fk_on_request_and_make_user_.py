"""drop user fk on request and make user_id nullable

Revision ID: cbb05eb74952
Revises: 
Create Date: 2025-11-18 12:55:55.774519

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cbb05eb74952'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1) FK 제거 (이름은 에러 메시지에 나온 그대로 사용)
    op.drop_constraint(
        "fk_req_beautiq_user",  # 제약조건 이름
        "request",              # 테이블 이름
        type_="foreignkey",
    )

    # 2) user_id nullable 허용
    op.alter_column(
        "request",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade():
    # 되돌릴 때를 위해 다시 NOT NULL + FK 복원
    op.alter_column(
        "request",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.create_foreign_key(
        "fk_req_beautiq_user",
        "request",
        "beautiq_user",
        ["user_id"],
        ["user_id"],
    )
