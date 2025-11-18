from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas.request import RequestCreateReq, RequestCreateResp
from core.db import get_db
from models.request import Request
from models.report_bm import ReportBM
from schemas.request import RequestAdminListResp, RequestAdminItem
from schemas.request_lookup import RequestLookupReq, RequestLookupResp, RequestLookupReport
from services.report_service import render_bm_sections_html
import hashlib
import json
router = APIRouter()

def hash_view_pw(plain_pw: str) -> str:
    # 실제 서비스에서는 bcrypt, argon2 같은걸 써야 함
    return hashlib.sha256(plain_pw.encode("utf-8")).hexdigest()

@router.post("/request", response_model=RequestCreateResp, status_code=201)
def create_request(payload: RequestCreateReq, db: Session = Depends(get_db)):
    req = Request(
        # user_id=1,  # 나중에 로그인 시스템 생기면 실제 user_id로 교체
        activity_name=payload.activity_name,
        platform=payload.platform,
        channel_name=payload.channel_name,
        category_code=payload.category_code,
        brand_concept=payload.brand_concept,
        contact_method=payload.contact_method,
        email=payload.email,
        view_pw_hash=hash_view_pw(payload.view_pw),
    )

    db.add(req)
    db.commit()
    db.refresh(req)

    return RequestCreateResp(
        request_id=req.request_id,
        message="의뢰가 정상적으로 접수되었습니다.",
    )

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
    return hash_view_pw(plain_pw) == stored_hash

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

    # (3) contents(JSON) 에서 sections만 꺼내서 HTML로 렌더
    try:
        contents = json.loads(report.contents) if isinstance(report.contents, str) else report.contents
    except Exception:
        contents = {}

    sections = contents.get("sections") or {}
    html_body = render_bm_sections_html(sections)

    # (4) HTML만 담아서 응답
    return RequestLookupResp(
        available=True,
        message="리포트가 준비되었습니다.",
        report=RequestLookupReport(
            report_id=report.report_id,
            request_id=report.request_id,
            title=report.title,
            html=html_body,
        ),
    )

