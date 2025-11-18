# models/report_creator.py
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
    Numeric,
    Enum,
    JSON,
    func
    
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from core.db import Base
from enum import Enum as PyEnum

class PlatformEnum(PyEnum):
    youtube = "youtube"
    instagram = "instagram"
    tiktok = "tiktok"

class ReportCreator(Base):
    __tablename__ = "report_creator"

    report_creator_id = Column(BigInteger, primary_key=True, autoincrement=True)
    request_id        = Column(BigInteger, ForeignKey("request.request_id"), nullable=False)
    latest_run_id     = Column(BigInteger, nullable=True)
    version           = Column(Integer, nullable=False, default=1)

    title             = Column(String(300), nullable=False)
    platform          = Column(Enum(PlatformEnum), nullable=False)
    channel_url       = Column(String(500))
    channel_handle    = Column(String(200))
    channel_external_id = Column(String(128))

    blc_score         = Column(Numeric(5, 2))
    blc_grade         = Column(String(20))
    blc_grade_label   = Column(String(50))
    blc_tier          = Column(String(50))

    subscriber_count  = Column(BigInteger)

    engagement_score  = Column(Numeric(7, 2))
    views_score       = Column(Numeric(7, 2))
    demand_score      = Column(Numeric(7, 2))
    problem_score     = Column(Numeric(7, 2))
    format_score      = Column(Numeric(7, 2))
    consistency_score = Column(Numeric(7, 2))

    meta_json              = Column(JSON, nullable=False, default=dict)
    executive_summary_json = Column(JSON, nullable=False, default=dict)
    deep_analysis_json     = Column(JSON, nullable=False, default=dict)
    blc_matching_json      = Column(JSON, nullable=False, default=dict)
    risk_mitigation_json   = Column(JSON, nullable=False, default=dict)

    created_at        = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at        = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
