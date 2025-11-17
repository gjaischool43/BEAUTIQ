# services/bm_runner.py (예시)

from sqlalchemy.orm import Session
from models import Request, ReportBM
from services.report_service import build_bm_report_from_df
import pandas as pd
def run_bm_for_request(db: Session, request_id: int, df_products: pd.DataFrame, channel_url: str | None):
    req = db.query(Request).filter(Request.request_id == request_id).first()
    if not req:
        raise ValueError("해당 request_id 가 존재하지 않습니다.")

    # 위에서 만든 함수로 report_BM 컬럼 dict 생성
    cols = build_bm_report_from_df(
        df=df_products,
        request_obj=req,
        channel_url=channel_url,
        topn_ings=15,
    )

    # version 결정(예: 해당 request_id 의 기존 리포트 개수 + 1)
    latest_version = (
        db.query(ReportBM)
        .filter(ReportBM.request_id == request_id)
        .count()
    )
    version = latest_version + 1

    report = ReportBM(
        request_id=request_id,
        version=version,
        **cols,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
