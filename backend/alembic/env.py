# backend/alembic/env.py
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# === 1) backend 폴더를 sys.path에 가장 먼저 추가 ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# 이제 backend/ 밑의 패키지들을 import 가능
# backend/models/base.py 에서 Base 정의
from models.base import Base       # Base = declarative_base() 반환
import models.request              # noqa: F401  (모델 등록용)

# === 2) Alembic 기본 설정 ===

# Alembic Config 객체
config = context.config

# logging 설정
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DATABASE_URL 환경변수 읽기
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL 환경변수가 설정되지 않았습니다.")

# alembic.ini 의 sqlalchemy.url 을 env값으로 덮어쓰기
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# MetaData 설정 (Base를 상속한 모든 모델들이 여기에 들어감)
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """오프라인 모드: DB에 실제 연결 없이 SQL만 생성."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """온라인 모드: 실제 DB에 연결해서 migration."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
