from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.db import get_db
from models.request import Request
from models.report_bm import ReportBM
from schemas.analysis import AnalysisStartResp
from schemas.request import RequestAdminListResp, RequestAdminItem
from services.report_service import build_bm_report_for_request
from services.creator_report_service import build_creator_report_for_request
from models.report_creator import ReportCreator
from services.creator_report_service import (
    build_creator_report_for_request,
    creator_report_to_dict,
)

router = APIRouter()

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
        else:
            status = "ready"
            report_id = report.report_id
            is_exported = bool(report.is_exported)
            channel_url = report.channel_name

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
                status=status,        # 🔹 여기서 status 세팅
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
    - 2) 존재하면 분석 수행 (report_BM 생성)
    - 3) 성공 시 '준비완료' 상태가 되므로 status='ready'로 응답
    - 4) request 미존재 시 404 에러
    """

    # 1) request 존재 여부 확인
    req = (
        db.query(Request)
        .filter(Request.request_id == request_id)
        .first()
    )
    if not req:
        # 의뢰가 없으면 준비중도 활성화되면 안 됨
        raise HTTPException(
            status_code=404,
            detail="해당 의뢰를 찾을 수 없습니다. (request_id 불일치)"
        )

    channel_url = req.channel_name  # 또는 req.channel_url 이 있으면 그걸 사용
    
    try:
        # 2-1) BM 보고서 생성
        bm_report = build_bm_report_for_request(
            db=db,
            request_id=request_id,
            channel_url=channel_url,
            topn_ings=15,
        )

        # 2-2) 크리에이터 분석 보고서 생성
        creator_report = build_creator_report_for_request(
            db=db,
            request_id=request_id,
        )
    except Exception as e:
        # 분석 중 에러 났으면 500 리턴
        raise HTTPException(
            status_code=500,
            detail=f"분석 중 오류가 발생했습니다: {e}",
        )

    # (선택) 분석 완료 후 request.status 업데이트
    # if req.status != "completed":
    #     req.status = "completed"
    #     db.commit()

    # 3) 리포트가 생성되었으므로 상태는 '준비완료(ready)'
    return AnalysisStartResp(
        request_id=request_id,
        status="ready",
        creator_report_id= creator_report.report_creator_id,
        
        message="분석이 완료되었습니다. (준비완료)"
    )

