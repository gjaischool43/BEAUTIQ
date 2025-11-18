from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas.request import RequestCreate, RequestCreateResp
from core.db import get_db
from models.request import Request
from models.report_bm import ReportBM
from schemas.request import RequestAdminListResp, RequestAdminItem
from schemas.request_lookup import RequestLookupReq, RequestLookupResp, RequestLookupReport
router = APIRouter()

@router.post("/request", response_model=RequestCreateResp)
def create_request_api(payload: RequestCreate, db: Session = Depends(get_db)):
    try:
        new_id = RequestCreate(db, payload=payload)
        return RequestCreateResp(request_id=new_id, message="의뢰가 접수되었습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")

# @router.get("/admin/requests", response_model=RequestAdminListResp)
# def list_requests_for_admin(db: Session = Depends(get_db)):
#     # Request + ReportBM 를 조인해서 상태를 계산
#     q = (
#         db.query(Request, ReportBM)
#         .outerjoin(ReportBM, ReportBM.request_id == Request.request_id)
#         .order_by(Request.request_id.desc())
#     )

#     items: list[RequestAdminItem] = []
#     for req, report in q.all():
#         status = "ready" if report is not None else "preparing"
#         items.append(
#             RequestAdminItem(
#                 request_id=req.request_id,
#                 activity_name=req.activity_name,
#                 platform=req.platform,
#                 channel_name=req.channel_name,
#                 category_code=req.category_code,
#                 brand_concept=req.brand_concept,
#                 contact_method=req.contact_method,
#                 email=req.email,
#                 status=status,
#                 report_id=report.report_id if report else None,
#                 is_exported=report.is_exported if report else False,
#             )
#         )

#     return RequestAdminListResp(items=items)
# bcrypt / passlib 같은 걸 쓰고 있다면 그 함수로 교체
def verify_view_pw(plain_pw: str, stored_hash: str) -> bool:
    # TODO: 실제 해시 검증 로직으로 교체
    # 예: return pwd_context.verify(plain_pw, stored_hash)
    return plain_pw == stored_hash

@router.post("/request/lookup", response_model=RequestLookupResp)
def lookup_request_report(payload: RequestLookupReq, db: Session = Depends(get_db)):
    # 1) email + view_pw 로 의뢰 찾기
    req = (
        db.query(Request)
        .filter(Request.email == payload.email)
        .order_by(Request.request_id.desc())
        .first()
    )
    if not req:
        # email, pw 틀리면 같은 메시지로 처리 (보안상)
        return RequestLookupResp(
            available=False,
            message="리포트가 준비중입니다.",
            report=None,
        )

    #  열람 비밀번호 검증 (view_pw_hash 컬럼 사용)
    if not verify_view_pw(payload.view_pw, req.view_pw_hash):
        # 비밀번호가 틀려도 같은 응답
        return RequestLookupResp(
            available=False,
            message="리포트가 준비중입니다.",
            report=None,
        )
    
    # 2) BM 보고서 존재 여부 확인
    report = (
        db.query(ReportBM)
        .filter(ReportBM.request_id == req.request_id)
        .first()
    )

    if not report or not report.is_exported:
        # 보고서가 없거나, 내보내기 전이면 조회 불가
        return RequestLookupResp(
            available=False,
            message="리포트가 준비중입니다.",
            report=None,
        )

    # 3) 내보내기가 완료된 보고서 반환
    return RequestLookupResp(
        available=True,
        message="리포트가 준비되었습니다.",
        report=RequestLookupReport(
            report_id=report.report_id,
            request_id=report.request_id,
            title=report.title,
            contents=report.contents,
        ),
    )

# app/api/admin_request.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.db import get_db
from models.request import Request
from models.report_bm import ReportBM
from schemas.analysis import AnalysisStartResp
from services.report_service import build_bm_report_for_request

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

    # (선택) request.status 활용 중이면 여기서 'processing' 으로 잠깐 바꿔도 됨
    #   ex) request_status_enum 이 'submitted', 'processing', 'completed' 라고 가정:
    # if req.status == "submitted":
    #     req.status = "processing"
    #     db.commit()
    #     db.refresh(req)

    # 2) 실제 BM 분석/생성 실행
    #    - 내부에서 oliveyoung_review를 읽어오고,
    #    - report_BM 레코드를 생성
    try:
        report = build_bm_report_for_request(
            db=db,
            request_id=request_id,
            channel_url=None,  # 필요하면 request.channel_name 기반으로 채널 URL을 넘겨도 됨
            topn_ings=15,
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
        message="분석이 완료되었습니다. (준비완료)"
    )
