# app.py
import os, io, json, datetime, re, logging
from collections import Counter
from typing import List, Literal, Dict, Any, Optional

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, constr
from starlette.concurrency import run_in_threadpool
from db_digest import BuildReportInput, BuildReportOutput, build_report_from_df, RequestCreateResp, RequestCreate
from fastapi import Query
from db_digest import fetch_reviews_df

from sqlalchemy import text
import bcrypt

from db_digest import engine  # 기존에 사용 중인 SQLAlchemy engine 재사용

from fastapi.middleware.cors import CORSMiddleware

# ───────── FastAPI 앱 ─────────
app = FastAPI(title="BM Report API", version="1.0")


origins = [
    "http://localhost:5173",
    "https://<your-frontend-on-render>.onrender.com",
    "https://<your-custom-domain>"  # 커스텀 도메인 사용 시
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], ## 초기엔 *로 테스트하고 배포후에 프론트 주소로 교체해야됨(ex. https://beautiq-frontend.onrender.com)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/healthz")
def healthz():
    return {"ok": True}

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI on Render!"}

@app.post("/build_report_json", response_model=BuildReportOutput)
def build_report_json(payload: BuildReportInput):
    try:
        df = pd.DataFrame(payload.csv.rows, columns=payload.csv.columns)
        return build_report_from_df(
            df=df,
            influencer=payload.influencer,
            category=payload.category,
            concept=payload.concept,
            channel_url=payload.channel_url,
            topn_ings=payload.topn_ings
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.exception("build_report_json failed")
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")

# @app.post("/build_report_file", response_model=BuildReportOutput)
# async def build_report_file(
#         influencer: str = Form(...),
#         category: str = Form(...),
#         concept: str = Form(...),
#         channel_url: str = Form(...),
#         topn_ings: int = Form(15),
#         file: UploadFile = File(...)
# ):
#     try:
#         content = await file.read()
#         if not content:
#             raise HTTPException(status_code=400, detail="비어있는 파일입니다.")
#         try:
#             df = pd.read_csv(io.BytesIO(content))
#         except Exception:
#             # 인코딩/구분자 재시도(필요시 보강)
#             try:
#                 df = pd.read_csv(io.BytesIO(content), encoding="cp949")
#             except Exception as e2:
#                 raise HTTPException(status_code=400, detail=f"CSV 파싱 오류: {e2}")

#         # 블로킹 로직은 스레드풀
#         return await run_in_threadpool(
#             build_report_from_df, df, influencer, category, concept, channel_url, topn_ings
#         )
#     except HTTPException:
#         raise
#     except Exception as e:
#         logging.exception("build_report_file failed")
#         raise HTTPException(status_code=500, detail=f"서버 오류: {e}")




@app.get("/build_report_db", response_model=BuildReportOutput)
async def build_report_db(
    influencer: str = Query(...),
    category: str = Query(..., description="리포트 표기용 카테고리(그대로 meta에 들어감)"),
    concept: str = Query(...),
    channel_url: str = Query(...),
    topn_ings: int = Query(15, ge=5, le=50),

    # DB 필터용 파라미터
    category_code: str = Query(..., description="DB 조회 필터용(예: skin_toner 등)"),
    source: str = Query("oliveyoung", description="oliveyoung/coupang/naver"),
    min_analyzed_at: str | None = Query(None, description="YYYY-MM-DD"),
    limit: int = Query(500, ge=1, le=5000),
):
    try:
        # 1) DB → DataFrame (블로킹 가능성이 있어 스레드풀로 실행)
        df = await run_in_threadpool(
            fetch_reviews_df,
            category_code=category_code,
            source=source,
            min_analyzed_at=min_analyzed_at,
            limit=limit,
        )
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="해당 조건에 일치하는 데이터가 없습니다.")

        # 2) DF → 리포트(동일하게 스레드풀에서 실행)
        return await run_in_threadpool(
            build_report_from_df, df, influencer, category, concept, channel_url, topn_ings
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("build_report_db failed")
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")

# create_request : 의뢰서 내용 db에 저장하기
@app.post("/request", response_model=RequestCreateResp)
def create_request(payload: RequestCreate):
    try:
        # 1) 비밀번호 해시(bcrypt, PHC 포맷은 아니지만 안전)
        pw_hash = bcrypt.hashpw(payload.view_pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        # 2) INSERT
        sql = text("""
            INSERT INTO request (
                user_id,            -- 내부 운영자 계정(있다면 적절히 세팅, 없으면 1 같은 기본값)
                activity_name,
                platform,
                channel_name,
                category_code,
                brand_concept,
                contact_method,
                email,
                view_pw_hash
            ) VALUES (
                :user_id,
                :activity_name,
                :platform,
                :channel_name,
                :category_code,
                :brand_concept,
                :contact_method,
                :email,
                :view_pw_hash
            )
        """)
        params = {
            "user_id": 1,  # 운영자/담당자 지정 로직이 있다면 교체
            "activity_name": payload.activity_name,
            "platform": payload.platform,
            "channel_name": payload.channel_name,
            "category_code": payload.category_code,
            "brand_concept": payload.brand_concept,
            "contact_method": payload.contact_method,
            "email": payload.email,
            "view_pw_hash": pw_hash,
        }

        with engine.begin() as conn:
            conn.execute(sql, params)
            new_id = conn.execute(text("SELECT LAST_INSERT_ID()")).scalar_one()

        return RequestCreateResp(request_id=int(new_id), message="의뢰가 접수되었습니다.")
    except Exception as e:
        logging.exception("create_request failed")
        # 스키마 위반(ENUM/체크) 시 MySQL 에러가 날 수 있음
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")