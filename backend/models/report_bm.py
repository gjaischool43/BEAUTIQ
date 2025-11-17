# models/report_bm.py
from typing import Any, Dict, Optional

from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from core.db import Base


class ReportBM(Base):
    """
    report_BM 테이블 매핑

    CREATE TABLE report_BM (
      report_id         BIGSERIAL PRIMARY KEY,

      report_creator_id BIGINT NULL,
      request_id        BIGINT NOT NULL,
      latest_run_id     BIGINT NULL,
      version           INT NOT NULL DEFAULT 1,

      influencer_name   VARCHAR(200) NOT NULL,
      brand_concept     VARCHAR(500) NOT NULL,
      channel_url       VARCHAR(500),
      category_label    VARCHAR(120),
      generated_ts_str  VARCHAR(32),
      title             VARCHAR(300),
      summary_md        TEXT,

      ... (각종 *_json, tables, contents, timestamps ...)
    );
    """

    __tablename__ = "report_bm"  # report_BM → 실제 Postgres에서는 소문자로 저장됨

    report_id = Column(BigInteger, primary_key=True, autoincrement=True)

    report_creator_id = Column(BigInteger, nullable=True)
    request_id = Column(
        BigInteger,
        ForeignKey("request.request_id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
    )
    latest_run_id = Column(BigInteger, nullable=True)

    version = Column(Integer, nullable=False, server_default=text("1"))

    influencer_name = Column(String(200), nullable=False)
    brand_concept = Column(String(500), nullable=False)
    channel_url = Column(String(500), nullable=True)
    category_label = Column(String(120), nullable=True)
    generated_ts_str = Column(String(32), nullable=True)
    title = Column(String(300), nullable=True)
    summary_md = Column(Text, nullable=True)

    # --- 메인 섹션 JSON들 (NOT NULL) ---
    brand_summary_json = Column(JSONB, nullable=False)
    creator_analysis_json = Column(JSONB, nullable=False)
    market_landscape_json = Column(JSONB, nullable=False)
    concept_proposal_json = Column(JSONB, nullable=False)
    product_line_json = Column(JSONB, nullable=False)
    segmentation_positioning_json = Column(JSONB, nullable=False)
    brand_strategy_json = Column(JSONB, nullable=False)
    channel_strategy_json = Column(JSONB, nullable=False)
    financials_json = Column(JSONB, nullable=False)
    conclusion_next_json = Column(JSONB, nullable=False)
    appendix_json = Column(JSONB, nullable=False)

    # --- 보조 테이블들 ---
    competitors_table_json = Column(JSONB, nullable=True)
    kpi_table_json = Column(JSONB, nullable=True)
    products_table_json = Column(JSONB, nullable=True)

    top_products_table_md = Column(Text, nullable=True)
    full_markdown = Column(Text, nullable=True)

    contents = Column(JSONB, nullable=False)

    # --- 내보내기 상태 플래그 (요청했던 is_exported) ---
    # 기본값: False (아직 의뢰 조회에서 공개되지 않은 상태)
    is_exported = Column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("NOW()"),
    )

    __table_args__ = (
        # UNIQUE (request_id, version)
        UniqueConstraint("request_id", "version", name="uq_bm_request_version"),
        # 인덱스 idx_bm_request(request_id)는
        # Alembic migration에서 생성해도 되고, 여기서 만들어도 됨
        # Index("idx_bm_request", "request_id"),  # 필요하면 주석 해제
    )

    # Request 모델과의 관계 (필요시 사용)
    request = relationship("Request", lazy="joined")

    def to_dict(self) -> Dict[str, Any]:
        """
        선택: 응답용 직렬화를 편하게 하고 싶을 때 쓸 수 있는 헬퍼 메서드.
        꼭 필요하진 않지만 있으면 편함.
        """
        return {
            "report_id": self.report_id,
            "request_id": self.request_id,
            "version": self.version,
            "influencer_name": self.influencer_name,
            "brand_concept": self.brand_concept,
            "category_label": self.category_label,
            "title": self.title,
            "summary_md": self.summary_md,
            "is_exported": self.is_exported,
            "generated_ts_str": self.generated_ts_str,
        }
