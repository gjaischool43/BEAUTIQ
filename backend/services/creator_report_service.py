# services/creator_report_service.py

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.request import Request
from models.report_creator import ReportCreator

## 수정 포인트
def run_creator_analysis_pipeline(channel_name: str) -> Dict[str, Any]:
    """
    실제로는 너가 Jupyter Notebook 에서 쓰던 채널 분석 코드를
    함수로 옮겨놓은 자리.

    지금은 구조만 맞춘 더미 구현 예시.
    나중에 여기 안에:
    - YouTube API / 크롤링
    - 기존 BLC 점수 계산
    - LLM 호출 (요약/Deep analysis 등)
    을 넣으면 됨.
    """
    # TODO: 실제 로직으로 교체
    return {
        "latest_run_id": None,
        "title": f"{channel_name} 크리에이터 분석 리포트",
        "platform": "youtube",
        "channel_url": None,
        "channel_handle": channel_name,
        "channel_external_id": None,
        "blc_score": 55.3,
        "blc_grade": "B",
        "blc_grade_label": "조건부 Go",
        "blc_tier": "Tier_2_Mid",
        "subscriber_count": 123000,
        "engagement_score": 102.4,
        "views_score": 97.8,
        "demand_score": 88.1,
        "problem_score": 74.2,
        "format_score": 90.5,
        "consistency_score": 83.7,
        "meta_json": {},
        "executive_summary_json": {},
        "deep_analysis_json": {},
        "blc_matching_json": {},
        "risk_mitigation_json": {},
    }

def build_creator_report_for_request(db: Session, request_id: int) -> ReportCreator:
    # 1) request 가져오기
    req = db.query(Request).filter(Request.request_id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    channel_name = req.channel_name  # 1단계: 채널명 추출

    # 2) 채널 분석 파이프라인 실행
    analysis_result = run_creator_analysis_pipeline(channel_name)

    rc = ReportCreator(
        request_id=request_id,
        latest_run_id=analysis_result.get("latest_run_id"),
        version=1,  # 나중에 재분석 지원하면 +1 로직 추가

        title=analysis_result["title"],
        platform=analysis_result["platform"],
        channel_url=analysis_result.get("channel_url"),
        channel_handle=analysis_result.get("channel_handle"),
        channel_external_id=analysis_result.get("channel_external_id"),

        blc_score=analysis_result.get("blc_score"),
        blc_grade=analysis_result.get("blc_grade"),
        blc_grade_label=analysis_result.get("blc_grade_label"),
        blc_tier=analysis_result.get("blc_tier"),

        subscriber_count=analysis_result.get("subscriber_count"),

        engagement_score=analysis_result.get("engagement_score"),
        views_score=analysis_result.get("views_score"),
        demand_score=analysis_result.get("demand_score"),
        problem_score=analysis_result.get("problem_score"),
        format_score=analysis_result.get("format_score"),
        consistency_score=analysis_result.get("consistency_score"),

        meta_json=analysis_result.get("meta_json", {}),
        executive_summary_json=analysis_result.get("executive_summary_json", {}),
        deep_analysis_json=analysis_result.get("deep_analysis_json", {}),
        blc_matching_json=analysis_result.get("blc_matching_json", {}),
        risk_mitigation_json=analysis_result.get("risk_mitigation_json", {}),
    )

    db.add(rc)
    db.commit()
    db.refresh(rc)
    return rc

def creator_report_to_dict(rc: Optional[ReportCreator]):
    if rc is None:
        return None

    return {
        "report_creator_id": rc.report_creator_id,
        "title": rc.title,
        "platform": rc.platform,
        "channel_url": rc.channel_url,
        "channel_handle": rc.channel_handle,
        "blc_score": float(rc.blc_score) if rc.blc_score is not None else None,
        "blc_grade": rc.blc_grade,
        "blc_grade_label": rc.blc_grade_label,
        "blc_tier": rc.blc_tier,
        "subscriber_count": rc.subscriber_count,
        "engagement_score": float(rc.engagement_score) if rc.engagement_score is not None else None,
        "views_score": float(rc.views_score) if rc.views_score is not None else None,
        "demand_score": float(rc.demand_score) if rc.demand_score is not None else None,
        "problem_score": float(rc.problem_score) if rc.problem_score is not None else None,
        "format_score": float(rc.format_score) if rc.format_score is not None else None,
        "consistency_score": float(rc.consistency_score) if rc.consistency_score is not None else None,
        "meta": rc.meta_json,
        "executive_summary": rc.executive_summary_json,
        "deep_analysis": rc.deep_analysis_json,
        "blc_matching": rc.blc_matching_json,
        "risk_mitigation": rc.risk_mitigation_json,
        "created_at": rc.created_at,
    }

