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
            detail="해당 의뢰를 찾을 수 없습니다. (request_id 불일치)",
        )

    # 기존 코드에서 잘못 들어가 있던 부분 (rows, for 루프) 제거:
    #   for req, report in rows:
    #       channel_url = report.channel_url if report is not None else None
    #
    # 이 엔드포인트에서는 단일 request만 다루기 때문에,
    # request 레코드에서 채널 URL을 가져오거나, 없으면 None으로 둔다.
    # channel_url = getattr(req, "channel_url", None)

    try:
        # 2-1) BM 보고서 생성
        bm_report = build_bm_report_for_request(
            db=db,
            request_id=request_id,
            # channel_url=channel_url, # channel_url은 서비스 함수 내부에서 결정
            # topn_ings=15,
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
        creator_report_id=creator_report.report_creator_id,
        message="분석이 완료되었습니다. (준비완료)",
    )

@router.get("/admin/requests/{request_id}/creator-report")
def get_creator_report_for_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    """
    관리자 페이지에서 크리에이터 분석 리포트 보기용 엔드포인트
    - 해당 request_id에 대한 최신 ReportCreator 1건을 반환
    """

    # 1) request 존재 여부 확인 (선택적이지만 있으면 에러 메시지가 명확해짐)
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

    # 2) 이 의뢰에 대한 최신 크리에이터 리포트 조회
    creator_report: Optional[ReportCreator] = (
        db.query(ReportCreator)
        .filter(ReportCreator.request_id == request_id)
        .order_by(ReportCreator.version.desc())  # version이 있다면 최신 기준
        .first()
    )

    if creator_report is None:
        # 아직 크리에이터 리포트가 생성되지 않은 상태
        raise HTTPException(
            status_code=404,
            detail="해당 의뢰에 대한 크리에이터 분석 리포트가 없습니다.",
        )

    # 3) dict 형태로 변환해서 반환
    return creator_report_to_dict(creator_report)