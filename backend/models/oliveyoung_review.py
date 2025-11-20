# models/oliveyoung_review.py
from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Numeric,
    DateTime,
    Enum,
    func,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ENUM  # enum 타입 직접 쓰고 싶을 때
from core.db import Base


class OliveyoungReview(Base):
    """
    oliveyoung_review 테이블 매핑

    CREATE TABLE oliveyoung_review (
    id              BIGSERIAL PRIMARY KEY,
    product_id      VARCHAR(30) NOT NULL,
    product_name    VARCHAR(300) NOT NULL,
    score           NUMERIC(8,6) NOT NULL,
    key_ings        VARCHAR(1000) NOT NULL,
    summary3        VARCHAR(2000) NOT NULL,
    category_code   VARCHAR(50) NOT NULL,
    source          review_source_enum NOT NULL DEFAULT 'oliveyoung',
    review_cnt      BIGINT,
    share_pos       NUMERIC(8,6), 
    analyzed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_review_category_code
    CHECK (category_code IN ('skin_toner','essence_serum_ampoule','lotion','cream','mist_oil')),
    CONSTRAINT uq_source_product UNIQUE (source, product_id)
    );

    """

    __tablename__ = "oliveyoung_review"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    product_id = Column(String(30), nullable=False)
    product_name = Column(String(300), nullable=False)
    score = Column(Numeric(8, 6), nullable=False)
    key_ings = Column(String(1000), nullable=False)
    summary3 = Column(String(2000), nullable=False)
    category_code = Column(String(50), nullable=False)

    source = Column(
        Enum("oliveyoung", name="review_source_enum"),
        nullable=False,
        server_default="oliveyoung",
    )

    # ✅ 여기 두 줄이 반드시 필요
    review_cnt = Column(BigInteger, nullable=True)        # NOT NULL 풀었으니 nullable=True
    share_pos = Column(Numeric(8, 6), nullable=True)

    analyzed_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        UniqueConstraint("source", "product_id", name="uq_source_product"),
    )
