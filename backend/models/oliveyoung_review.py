# models/oliveyoung_review.py
from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Text,
    Numeric,
    DateTime,
    UniqueConstraint,
    Index,
    text,
)
from sqlalchemy.dialects.postgresql import ENUM  # enum 타입 직접 쓰고 싶을 때
from core.db import Base


class OliveyoungReview(Base):
    """
    oliveyoung_review 테이블 매핑

    CREATE TABLE oliveyoung_review (
      id              BIGSERIAL PRIMARY KEY,
      product_id      BIGINT NOT NULL,
      product_name    VARCHAR(300) NOT NULL,

      score           NUMERIC(8,6) NOT NULL,
      key_ings        VARCHAR(1000) NOT NULL,
      summary3        VARCHAR(2000) NOT NULL,

      category_code   VARCHAR(50) NOT NULL,
      source          review_source_enum NOT NULL DEFAULT 'oliveyoung',
      analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ...
    );
    """

    __tablename__ = "oliveyoung_review"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    product_id = Column(BigInteger, nullable=False)
    product_name = Column(String(300), nullable=False)

    score = Column(Numeric(8, 6), nullable=False)
    key_ings = Column(String(1000), nullable=False)
    summary3 = Column(String(2000), nullable=False)

    category_code = Column(String(50), nullable=False)

    # review_source_enum 을 이미 DB에 만들어둔 상태라고 가정
    # - Enum 타입을 굳이 쓰지 않고 String으로만 매핑해도 동작에는 문제 없음
    #   (이미 존재하는 enum 타입에 strict하게 맞추고 싶으면 아래 주석 참고)
    #
    # source = Column(
    #     ENUM(
    #         "oliveyoung",  # 실제 enum 멤버들로 채우기
    #         name="review_source_enum",
    #         create_type=False,  # 이미 DB에 타입이 있으므로 새로 만들지 않도록
    #     ),
    #     nullable=False,
    #     server_default=text("'oliveyoung'::review_source_enum"),
    # )
    source = Column(String(50), nullable=False, server_default=text("'oliveyoung'"))

    analyzed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )

    __table_args__ = (
        # UNIQUE (source, product_id)
        UniqueConstraint("source", "product_id", name="uq_source_product"),
        # 카테고리 인덱스
        Index("idx_oy_category", "category_code"),
        # FULLTEXT 대체 GIN 인덱스(ft_summary3)는 migration에서 생성해도 됨
        # Index(
        #     "ft_summary3",
        #     text("to_tsvector('simple', summary3)"),
        #     postgresql_using="gin",
        # ),
    )
