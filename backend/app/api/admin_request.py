from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from core.db import get_db
from models.request import Request
from models.report_bm import ReportBM
from models.report_creator import ReportCreator
from schemas.analysis import AnalysisStartResp
from schemas.request import RequestAdminListResp, RequestAdminItem
from services.report_service import build_bm_report_for_request
from services.creator_report_service import build_creator_report_for_request, creator_report_to_dict
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/admin/requests", response_model=RequestAdminListResp)
def list_requests_for_admin(db: Session = Depends(get_db)):
    """
    관리자 페이지에서 의뢰 목록 + 현재상태를 보기 위한 API
    - status: idle (report_BM 없음) / ready (report_BM 있음)
    """

    # Request 와 ReportBM 을 LEFT JOIN
    rows = (
        db.query(Request, ReportBM)
        .outerjoin(ReportBM, ReportBM.request_id == Request.request_id)
        .order_by(Request.request_id.desc())
        .all()
    )

    items: list[RequestAdminItem] = []

    for req, report in rows:
        if report is None:
            status: str = "idle"
            report_id = None
            is_exported = False
            # channel_url = None  # 필요하면 이렇게 쓸 수 있음
        else:
            status = "ready"
            # ReportBM 쪽 PK 이름이 report_id 라고 가정
            report_id = report.report_id
            is_exported = bool(getattr(report, "is_exported", False))
            # ❗ 기존 버그: report.channel_name 은 존재하지 않음
            # channel_url = report.channel_url  # 나중에 응답에 포함하고 싶으면 이걸 활용

        items.append(
            RequestAdminItem(
                request_id=req.request_id,
                activity_name=req.activity_name,
                platform=req.platform,
                channel_name=req.channel_name or "",
                category_code=req.category_code,
                brand_concept=req.brand_concept,
                contact_method=req.contact_method or "",
                email=req.email,
                status=status,
                report_id=report_id,
                is_exported=is_exported,
            )
        )

    return RequestAdminListResp(items=items)


@router.post("/admin/requests/{request_id}/start-analysis", response_model=AnalysisStartResp)
def start_analysis_for_request(request_id: int, db: Session = Depends(get_db)):
    """
    - 관리자 페이지에서 '분석하기' 버튼 클릭 시 사용하는 엔드포인트
    - 1) request 존재 여부 검사
    - 2) BM 보고서 생성 (실패 시 500 바로 리턴)
    - 3) 크리에이터 분석 보고서 생성 (실패해도 500은 안 던지고 로그만 남김)
    - 4) 최종적으로 BM 기준으로 status='ready' 응답
    """

    # 1) request 존재 여부 확인
    req = db.query(Request).filter(Request.request_id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=404,
            detail="해당 의뢰를 찾을 수 없습니다. (request_id 불일치)",
        )

    #
    # ---------------------------------------------------------------------
    # 2) ★ 크리에이터 분석을 먼저 생성해야 한다 (선행 조건)
    # ---------------------------------------------------------------------
    #
    try:
        creator_report = build_creator_report_for_request(
            db=db,
            request_id=request_id,
        )
    except Exception as e:
        logger.exception("[ADMIN] Creator report build failed (request_id=%s): %s",
                         request_id, e)
        msg = str(e)[:200]
        raise HTTPException(
            status_code=500,
            detail=f"크리에이터 분석 생성 실패: {msg}"
        )

    #
    # ---------------------------------------------------------------------
    # 3) ★ BM 보고서 생성 (Creator 결과 활용)
    # ---------------------------------------------------------------------
    #
    try:
        bm_report = build_bm_report_for_request(
            db=db,
            request_id=request_id,
            creator_report=creator_report,        # 중요!
        )
    except Exception as e:
        logger.exception("[ADMIN] BM report build failed (request_id=%s): %s",
                         request_id, e)
        msg = str(e)[:200]
        raise HTTPException(
            status_code=500,
            detail=f"BM 보고서 생성 실패: {msg}"
        )

    #
    # ---------------------------------------------------------------------
    # 4) 응답
    # ---------------------------------------------------------------------
    #
    return AnalysisStartResp(
        request_id=request_id,
        status="ready",
        creator_report_id=creator_report.report_creator_id,
        message="크리에이터 분석 + BM 분석 모두 완료되었습니다.",
    )


@router.get("/admin/requests/{request_id}/creator-report")
def get_creator_report_for_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    req = (
        db.query(Request)
        .filter(Request.request_id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(
            status_code=404,
            detail="해당 의뢰를 찾을 수 없습니다. (request_id 불일치)",
        )

    creator_report: Optional[ReportCreator] = (
        db.query(ReportCreator)
        .filter(ReportCreator.request_id == request_id)
        .order_by(ReportCreator.version.desc())
        .first()
    )

    if creator_report is None:
        return {
            "exists": False,
            "report": None
        }

    return {
        "exists": True,
        "report": creator_report_to_dict(creator_report)
    }
