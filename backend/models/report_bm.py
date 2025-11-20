# models/report_bm.py
from typing import Any, Dict, Optional

from sqlalchemy import (
    Column, BigInteger, Integer, String, Text, DateTime, Boolean,
    ForeignKey, JSON, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from core.db import Base


class ReportBM(Base):
    __tablename__ = "report_bm"

    report_id = Column(BigInteger, primary_key=True, autoincrement=True)
    report_creator_id = Column(BigInteger, nullable=True)
    request_id = Column(BigInteger, ForeignKey("request.request_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)
    latest_run_id = Column(BigInteger, nullable=True)

    version = Column(Integer, nullable=False, default=1)

    influencer_name = Column(String(200), nullable=False)
    brand_concept = Column(String(500), nullable=False)
    channel_url = Column(String(500))
    category_label = Column(String(120))
    generated_ts_str = Column(String(32))
    title = Column(String(300))

    summary_md = Column(Text)

    # JSON sections
    data_overview_json = Column(JSON)
    brand_summary_json = Column(JSON, nullable=False)
    market_analysis_json = Column(JSON, nullable=False)
    blc_strategy_json = Column(JSON)
    product_strategy_json = Column(JSON, nullable=False)
    price_strategy_json = Column(JSON, nullable=False)
    decision_log_json = Column(JSON, nullable=False)
    appendix_json = Column(JSON, nullable=False)

    competitors_table_json = Column(JSON)
    kpi_table_json = Column(JSON)
    products_table_json = Column(JSON)

    top_products_table_md = Column(Text)
    full_markdown = Column(Text)

    contents = Column(JSON, nullable=False)

    is_exported = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("request_id", "version", name="uq_bm_request_version"),
    )
