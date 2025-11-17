import pandas as pd
from fastapi import APIRouter, HTTPException, Depends, Query
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from schemas.report import BuildReportInput, BuildReportOutput
from services.report_service import build_report_from_df
from services.data_service import fetch_reviews_df
from core.db import get_db
from models.report_bm import ReportBM
from schemas.report import ReportBMDetail, ReportExportResp

router = APIRouter()

@router.get("/admin/report/{report_id}", response_model=ReportBMDetail)
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportBM).filter(ReportBM.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")
    return report

@router.post("/admin/report/{report_id}/export", response_model=ReportExportResp)
def export_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(ReportBM).filter(ReportBM.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="보고서를 찾을 수 없습니다.")

    report.is_exported = True
    db.commit()
    db.refresh(report)
    return ReportExportResp(report_id=report.report_id, is_exported=report.is_exported)


# @router.post("/build_report_json", response_model=BuildReportOutput)
# def build_report_json(payload: BuildReportInput):
#     try:
#         df = pd.DataFrame(payload.csv.rows, columns=payload.csv.columns)
#         r = build_report_from_df(df, payload.influencer, payload.category, payload.concept,
#                                  payload.channel_url, payload.topn_ings)
#         return r
#     except ValueError as ve:
#         raise HTTPException(status_code=400, detail=str(ve))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"서버 오류: {e}")

# @router.get("/build_report_db", response_model=BuildReportOutput)
# async def build_report_db(
#     influencer: str = Query(...),
#     category: str = Query(...),
#     concept: str = Query(...),
#     channel_url: str = Query(...),
#     topn_ings: int = Query(15, ge=5, le=50),
#     category_code: str = Query(...),
#     source: str = Query("oliveyoung"),
#     min_analyzed_at: str | None = Query(None),
#     limit: int = Query(500, ge=1, le=5000),
#     db: Session = Depends(get_db),
# ):
    # try:
    #     df = await run_in_threadpool(fetch_reviews_df, db,
    #                                  category_code=category_code, source=source,
    #                                  min_analyzed_at=min_analyzed_at, limit=limit)
    #     if df is None or df.empty:
    #         raise HTTPException(status_code=404, detail="해당 조건에 일치하는 데이터가 없습니다.")
    #     r = await run_in_threadpool(build_report_from_df, df, influencer, category, concept, channel_url, topn_ings)
    #     return r
    # except HTTPException:
    #     raise
    # except Exception as e:
    #     raise HTTPException(status_code=500, detail=f"서버 오류: {e}")
