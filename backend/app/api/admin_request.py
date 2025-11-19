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

    # 2-1) BM 보고서 생성 (여기서 실패하면 바로 500)
    try:
        bm_report = build_bm_report_for_request(
            db=db,
            request_id=request_id,
            # topn_ings=15  # 필요하면 다시 열어도 됨
        )
    except Exception as e:
        # BM 쪽 에러는 반드시 알아야 하니까 exception 로그 + 500
        logger.exception(
            "[ADMIN] BM report build failed (request_id=%s): %s",
            request_id,
            e,
        )
        # 에러 메시지는 너무 길지 않게 잘라서 내려줌
        msg = str(e)
        if len(msg) > 200:
            msg = msg[:200] + "..."
        raise HTTPException(
            status_code=500,
            detail=f"BM 보고서 생성 중 오류가 발생했습니다: {msg}",
        )

    # 2-2) 크리에이터 분석 보고서 생성 (실패해도 서비스 전체는 500 안 던짐)
    creator_report = None
    creator_error_msg: Optional[str] = None

    try:
        creator_report = build_creator_report_for_request(
            db=db,
            request_id=request_id,
        )
    except Exception as e:
        # 여기서만 터지는 경우: BM은 이미 생성/커밋된 상태
        logger.exception(
            "[ADMIN] Creator report build failed (request_id=%s): %s",
            request_id,
            e,
        )
        msg = str(e)
        if len(msg) > 200:
            msg = msg[:200] + "..."
        creator_error_msg = f"크리에이터 분석 리포트 생성 중 오류가 발생했습니다: {msg}"

    # 3) 최종 응답 구성
    #    - BM은 이미 생성됐으므로 status는 'ready'로 유지
    #    - creator_report가 없으면 creator_report_id=None + 경고 메시지 포함
    base_msg = "BM 분석은 정상적으로 완료되었습니다."
    if creator_report is None and creator_error_msg:
        final_msg = base_msg + " " + creator_error_msg
    elif creator_report is None:
        final_msg = base_msg + " (크리에이터 분석 리포트는 생성되지 않았습니다.)"
    else:
        final_msg = base_msg + " 크리에이터 분석 리포트도 생성되었습니다."

    return AnalysisStartResp(
        request_id=request_id,
        status="ready",
        creator_report_id=creator_report.report_creator_id if creator_report else None,
        message=final_msg,
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
