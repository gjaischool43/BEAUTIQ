import os, io, json, datetime, re, logging
from collections import Counter
from typing import List, Literal, Dict, Any

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, constr
from starlette.concurrency import run_in_threadpool

import os, logging
from typing import Literal, Optional, TypeAlias
from fastapi import FastAPI, HTTPException

from sqlalchemy import text
import bcrypt

from db_digest import engine  # 기존에 사용 중인 SQLAlchemy engine 재사용

# ───────── OpenAI: lazy client ─────────
from openai import OpenAI

import os
from sqlalchemy import create_engine

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(DB_URL, pool_pre_ping=True)

ShortStr: TypeAlias = constr(min_length=1, max_length=200)
LongStr: TypeAlias = constr(min_length=1, max_length=5000)
_client = None



def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        # 환경변수 없더라도 하드코드 키가 있으면 생성
        key = os.getenv("OPENAI_API_KEY") or OPENAI_API_KEY
        if not key:
            raise RuntimeError("OPENAI_API_KEY가 설정되어 있지 않습니다.")
        _client = OpenAI(api_key=key)
    return _client

# ───────── 유틸 ─────────
def _tier(s: float) -> str:
    s = float(s)
    return "S" if s >= 0.85 else "A" if s >= 0.75 else "B" if s >= 0.60 else "C"

def md_table_from_rows(rows: List[List[Any]]) -> str:
    if not rows or not rows[0]:
        return ""
    head = "| " + " | ".join(map(str, rows[0])) + " |\n"
    sep  = "| " + " | ".join(["---"]*len(rows[0])) + " |\n"
    body = "".join("| " + " | ".join(map(str, r)) + " |\n" for r in rows[1:])
    return head + sep + body

def crop(s: str, n: int) -> str:
    s = s or ""
    return s if len(s) <= n else s[:n]

# ───────── LLM 설정 ─────────
PRIMARY_MODEL   = os.getenv("PRIMARY_MODEL", "gpt-5-mini")
FALLBACK_MODELS = [PRIMARY_MODEL, os.getenv("FALLBACK_MODEL_1", "gpt-4o-mini")]
MAX_TOK_SECTION = int(os.getenv("MAX_TOK_SECTION", "1500"))
MIN_ACCEPT_CHARS= int(os.getenv("MIN_ACCEPT_CHARS", "250"))

def llm_section(prompt: str, max_tok=MAX_TOK_SECTION, tries=3) -> str:
    base = prompt.strip()
    for m in FALLBACK_MODELS:
        p = base
        mtok = max_tok
        for i in range(tries):
            try:
                client = get_openai_client()
                resp = client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role":"system","content":"너는 한국어 BM 리포트 전문가다. 반드시 '마크다운 텍스트'만 출력한다. 코드블록/설명문 금지. 과장 금지. 표/리스트 적극 사용."},
                        {"role":"user","content":p}
                    ],
                    # 최신 스펙: max_tokens 대신 max_completion_tokens 사용
                    max_completion_tokens=mtok,
                )
                txt = (resp.choices[0].message.content or "").strip()
                if len(txt) >= MIN_ACCEPT_CHARS:
                    return txt
            except Exception as e:
                logging.warning(f"[LLM WARN] model={m} try={i+1}: {e}")
            # 실패 시 요약형 + 토큰 축소
            p = "아래 지시를 요약형으로, 표/리스트 중심으로, 군더더기 없이 작성하라.\n\n" + crop(base, 3500)
            mtok = max(900, int(mtok * 0.8))
    return "> [LLM 응답 부족으로 섹션 생성을 건너뜀]"

# ───────── 요약/통계 ─────────
def make_digest(df: pd.DataFrame, topn=15) -> dict:
    d: Dict[str, Any] = {}
    s = df["score"].astype(float)
    if len(s):
        d["score_stats"] = {
            "min": float(s.min()), "p10": float(s.quantile(0.10)),
            "p25": float(s.quantile(0.25)), "p50": float(s.quantile(0.50)),
            "p75": float(s.quantile(0.75)), "p90": float(s.quantile(0.90)),
            "max": float(s.max()), "mean": float(s.mean()),
            "std": float(s.std(ddof=0)), "rows": int(len(s)),
        }
    else:
        d["score_stats"] = {"rows": 0}
    d["tier_counts"] = {
        "S": int((df["score"]>=0.85).sum()),
        "A": int(((df["score"]>=0.75)&(df["score"]<0.85)).sum()),
        "B": int(((df["score"]>=0.60)&(df["score"]<0.75)).sum()),
        "C": int((df["score"]<0.60).sum()),
    }
    c = Counter()
    for s_ in df["key_ings"].fillna(""):
        for t in re.split(r"[,\|/;]", str(s_)):
            t = t.strip()
            if t:
                c[t]+=1
    d["top_key_ings"] = [{"token":k,"cnt":v} for k,v in c.most_common(topn)]

    cols = [c for c in ["product_id","product_name","score","key_ings","summary3"] if c in df.columns]
    top = (df.sort_values("score", ascending=False).head(max(10, topn))[cols]).fillna("")
    rows = [["product_id","name","score","tier","key_ings","insight"]]
    for _, r in top.iterrows():
        rows.append([
            str(r.get("product_id","")),
            str(r.get("product_name","")),
            f'{float(r.get("score",0.0)):.3f}',
            _tier(r.get("score",0.0)),
            str(r.get("key_ings","")),
            (str(r.get("summary3",""))[:160] + "…") if len(str(r.get("summary3",""))) > 160 else str(r.get("summary3","")),
        ])
    d["top_products_table"] = rows
    d["top_products_table_md"] = md_table_from_rows(rows)
    return d

# ───────── 프롬프트 생성 ─────────
def make_prompts(digest_brief: str, top_table_md: str,
                 influencer: str, category: str, concept: str, channel_url: str):
    def P(title, body): return body.strip()
    p1 = f"""
제목: "# 1) 브랜드 요약 (Brand Summary)"
필수 항목(각 1~2줄):
- 브랜드명 (가칭)
- 슬로건 / 콘셉트 문구
- 핵심 한 줄 정의
- 제안 배경 요약(데이터 수치 1~2개)
맥락: 인플루언서={influencer}, 카테고리={category}, 콘셉트={concept}
[데이터 요약]
{digest_brief}
[상위 제품 테이블(참고)]
{top_table_md}
"""
    p2 = f"""
제목: "# 2) 크리에이터 분석 (Creator Analysis)"
포함:
- 채널 정보 (YouTube, 링크={channel_url} 표기; 수치 추정 금지)
- 주요 카테고리 (key_ings/summary3 단서 기반)
- 감성 톤 & 언어 패턴
- 팬 반응(긍/부 뉘앙스)
- 강점/차별점
[데이터 요약]
{digest_brief}
[상위 제품 테이블(참고)]
{top_table_md}
"""
    p3 = f"""
제목: "# 3) 시장 분석 (Market Landscape)"
포함:
- 카테고리 정의/기회(2~3문단)
- 경쟁 포지션 표(브랜드|핵심성분/속성|추정 포지션) — CSV 관찰 기반, '추정' 명시
- 가격/성분/포지셔닝 서술
- 리뷰 인사이트(4~6)
- 공백 니즈(3~5)
[데이터 요약]
{digest_brief}
"""
    p4 = f"""
제목: "# 4) 브랜드 콘셉트 제안 (Concept Proposal)"
포함:
- 핵심 콘셉트(1문단)
- 핵심 속성(5~8)
- 톤앤매너(4~6)
- 비주얼 콘셉트(3~5줄)
- 타깃(1문단)
[데이터 요약]
{digest_brief}
"""
    p5 = f"""
제목: "# 5) 제품 제안 (Product Proposal)"
요구: 표 1개 + 불릿
- 표: 제품명|주요 성분|제형|차별 포인트|소비자 문장 (≤3행)
- 불릿: 타깃/사용상황/리스크(3~6개)
[데이터 요약]
{digest_brief}
"""
    p6 = f"""
제목: "# 6) 타깃 세그먼트 및 포지셔닝 (Segmentation & Positioning)"
포함:
- 타깃 세그먼트(4~6줄)
- 페르소나(5~8)
- STP 요약표(3행)
- 포지셔닝 맵 서술(1문단)
[데이터 요약]
{digest_brief}
"""
    p7 = f"""
제목: "# 7) 브랜딩 전략 (Brand Strategy)"
포함:
- 스토리라인(1문단)
- 톤앤매너 가이드(6~10)
- 로고/컬러 방향(4~6)
- 콘텐츠 스타일(6~10)
[데이터 요약]
{digest_brief}
"""
    p8 = f"""
제목: "# 8) 유통 및 채널 전략 (Channel Strategy)"
포함:
- 1차 채널(5~8)
- 2차 채널(5~8)
- 런칭 캠페인 플로우 표(단계|핵심액션|성과지표)
- 판매/KPI 표(metric|target|how_to_measure 6~10행)
[데이터 요약]
{digest_brief}
"""
    p9 = f"""
제목: "# 9) 재무 / 시뮬레이션 (Financial & Simulation)"
포함:
- 원가/마진/목표 판매(표: sku|assumption|notes — '가정' 명시)
- 채널별 ROI(표)
- 성장 시나리오(1년/3년)
- 리스크/대응(표 6~10행)
[데이터 요약]
{digest_brief}
"""
    p10 = f"""
제목: "# 10) 결론 및 제안 요약 (Conclusion & Next Step)"
포함:
- 핵심 요약(3줄)
- 제안 가치(3~5줄)
- 다음 단계(5~8)
[데이터 요약]
{digest_brief}
"""
    pA = f"""
제목: "# 📎 부록 (Appendix)"
포함(순서 고정):
1) 감성 분석 요약(5~8)
2) TF-IDF 상위 키워드 표(rank|token|note — 정성 메모)
3) 경쟁제품 분석표(brand|핵심성분/속성|메시지 톤|비고 — '추정' 명시)
4) 상위 제품 요약표(원문 표 재첨부)
[데이터 요약]
{digest_brief}
[상위 제품 테이블(원문)]
{top_table_md}
"""
    return [
        ("1) 브랜드 요약", p1),
        ("2) 크리에이터 분석", p2),
        ("3) 시장 분석", p3),
        ("4) 브랜드 콘셉트 제안", p4),
        ("5) 제품 제안", p5),
        ("6) 타깃 세그먼트 및 포지셔닝", p6),
        ("7) 브랜딩 전략", p7),
        ("8) 유통 및 채널 전략", p8),
        ("9) 재무 / 시뮬레이션", p9),
        ("10) 결론 및 제안 요약", p10),
        ("부록", pA),
    ]

# ───────── Pydantic 스키마 ─────────
class CSVRecords(BaseModel):
    type: Literal["records"] = "records"
    columns: List[str]
    rows: List[List[object]]


class BuildReportInput(BaseModel):
    influencer: str
    category: str
    concept: str
    channel_url: str
    topn_ings: int = 15
    csv: CSVRecords

class Section(BaseModel):
    title: str
    format: str = "md"
    content: str

class BuildReportOutput(BaseModel):
    meta: Dict[str, Any]
    digest: Dict[str, Any]
    sections: List[Section]

# --- Pydantic 모델 ---
class RequestCreate(BaseModel):
    activity_name: ShortStr
    platform: Literal['youtube','instagram','tiktok','x','etc']
    channel_name: ShortStr
    category_code: Literal['skin_toner','essence_serum_ampoule','lotion','cream','mist_oil']
    brand_concept: LongStr
    contact_method: constr(min_length=1, max_length=120)
    email: EmailStr
    view_pw: constr(min_length=4, max_length=128)

class RequestCreateResp(BaseModel):
    request_id: int
    message: str

# ───────── 핵심 로직 ─────────
def build_report_from_df(df: pd.DataFrame, influencer: str, category: str, concept: str,
                         channel_url: str, topn_ings: int) -> BuildReportOutput:
    for c in ["product_id","product_name","key_ings","summary3"]:
        if c not in df.columns:
            df[c] = ""
        df[c] = df[c].astype(str)

    if "score" not in df.columns:
        raise ValueError("CSV에 score 컬럼이 없습니다. (필수)")

    df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0.0)

    digest = make_digest(df, topn=topn_ings)
    digest_brief = json.dumps({
        "score_stats": digest.get("score_stats", {}),
        "tier_counts": digest.get("tier_counts", {}),
        "top_key_ings": (digest.get("top_key_ings", [])[:12]),
    }, ensure_ascii=False, indent=2)
    digest_brief = crop(digest_brief, 3000)
    top_table_md = crop(digest.get("top_products_table_md", ""), 2500)

    prompts = make_prompts(
        digest_brief, top_table_md,
        influencer=influencer, category=category,
        concept=concept, channel_url=channel_url
    )

    sections_md: List[Section] = []
    for label, pr in prompts:
        sections_md.append(Section(title=label, content=llm_section(pr)))

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return BuildReportOutput(
        meta={
            "influencer": influencer,
            "category": category,
            "concept": concept,
            "channel_url": channel_url,
            "created_at": ts
        },
        digest={
            "score_stats": digest.get("score_stats", {}),
            "tier_counts": digest.get("tier_counts", {}),
            "top_key_ings": digest.get("top_key_ings", [])[:12],
            "top_products_table_md": top_table_md
        },
        sections=sections_md
    )
