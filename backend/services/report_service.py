import re, json, datetime
from collections import Counter
from typing import Any, Dict, List, Mapping, Optional
import pandas as pd
from sqlalchemy.orm import Session
from core.llm import llm_section
from models.request import Request
from models.oliveyoung_review import OliveyoungReview
from models.report_bm import ReportBM

# -----------------------------------------------------------------------------
# 1. 헬퍼 함수들
# -----------------------------------------------------------------------------
def _tier(s: float) -> str:
    s = float(s)
    return "S" if s >= 0.85 else "A" if s >= 0.75 else "B" if s >= 0.60 else "C"


def md_table_from_rows(rows: List[List[Any]]) -> str:
    if not rows or not rows[0]:
        return ""
    head = "| " + " | ".join(map(str, rows[0])) + " |\n"
    sep = "| " + " | ".join(["---"] * len(rows[0])) + " |\n"
    body = "".join("| " + " | ".join(map(str, r)) + " |\n" for r in rows[1:])
    return head + sep + body


def crop(s: str, n: int) -> str:
    s = s or ""
    return s if len(s) <= n else s[:n]


def _get_attr(obj: Any, name: str, default: Any = None) -> Any:
    """
    request_obj 가 SQLAlchemy 모델이든 dict든 상관없이 안전하게 값 꺼내는 헬퍼
    """
    if obj is None:
        return default
    if isinstance(obj, Mapping):
        return obj.get(name, default)
    return getattr(obj, name, default)


CATEGORY_LABEL_MAP: Dict[str, str] = {
    "skin_toner": "스킨/토너",
    "essence_serum_ampoule": "에센스·세럼·앰플",
    "lotion": "로션",
    "cream": "크림",
    "mist_oil": "미스트·오일",
}


def make_digest(df: pd.DataFrame, topn: int = 15) -> Dict[str, Any]:
    """
    oliveyoung_review → DataFrame → 통계/상위 제품 요약
    """
    d: Dict[str, Any] = {}

    # 점수 통계
    s = df["score"].astype(float)
    if len(s):
        d["score_stats"] = {
            "min": float(s.min()),
            "p10": float(s.quantile(0.10)),
            "p25": float(s.quantile(0.25)),
            "p50": float(s.quantile(0.50)),
            "p75": float(s.quantile(0.75)),
            "p90": float(s.quantile(0.90)),
            "max": float(s.max()),
            "mean": float(s.mean()),
            "std": float(s.std(ddof=0)),
            "rows": int(len(s)),
        }
    else:
        d["score_stats"] = {"rows": 0}

    # 티어 카운트
    d["tier_counts"] = {
        "S": int((df["score"] >= 0.85).sum()),
        "A": int(((df["score"] >= 0.75) & (df["score"] < 0.85)).sum()),
        "B": int(((df["score"] >= 0.60) & (df["score"] < 0.75)).sum()),
        "C": int((df["score"] < 0.60).sum()),
    }

    # 주요 성분 토큰 집계
    c = Counter()
    for s_ in df["key_ings"].fillna(""):
        for t in re.split(r"[,\|/;]", str(s_)):
            t = t.strip()
            if t:
                c[t] += 1
    d["top_key_ings"] = [{"token": k, "cnt": v} for k, v in c.most_common(topn)]

    # 상위 제품 테이블
    cols = [
        c
        for c in ["product_id", "product_name", "score", "key_ings", "summary3"]
        if c in df.columns
    ]
    top = (df.sort_values("score", ascending=False).head(max(10, topn))[cols]).fillna("")

    rows = [["product_id", "name", "score", "tier", "key_ings", "insight"]]
    for _, r in top.iterrows():
        score_val = float(r.get("score", 0.0))
        insight = str(r.get("summary3", ""))
        if len(insight) > 160:
            insight = insight[:160] + "…"

        rows.append(
            [
                str(r.get("product_id", "")),
                str(r.get("product_name", "")),
                f"{score_val:.3f}",
                _tier(score_val),
                str(r.get("key_ings", "")),
                insight,
            ]
        )

    d["top_products_table"] = rows
    d["top_products_table_md"] = md_table_from_rows(rows)
    return d


# -----------------------------------------------------------------------------
# 2. 프롬프트 / 섹션 구성
# -----------------------------------------------------------------------------
SECTION_CONFIG = [
    ("brand_summary", "1. 브랜드 요약"),
    ("creator_analysis", "2. 크리에이터 채널 분석"),
    ("market_landscape", "3. 시장·경쟁 환경 분석"),
    ("concept_proposal", "4. 브랜드 콘셉트 제안"),
    ("product_line", "5. 제품 라인업 제안"),
    ("segmentation_positioning", "6. 타겟 세분화·포지셔닝"),
    ("brand_strategy", "7. 브랜드 전략"),
    ("channel_strategy", "8. 채널·콘텐츠 전략"),
    ("financials", "9. 수익·비즈니스 모델"),
    ("conclusion_next", "10. 결론·Next Step"),
    ("appendix", "부록·참고"),
]


def make_prompts_for_bm(
    digest_brief: str,
    top_table_md: str,
    influencer_name: str,
    category_label: str,
    brand_concept: str,
    channel_url: Optional[str],
) -> Dict[str, str]:
    """
    각 BM 섹션별로 사용할 프롬프트 문자열 생성
    """
    meta_block = json.dumps(
        {
            "influencer_name": influencer_name,
            "category_label": category_label,
            "brand_concept": brand_concept,
            "channel_url": channel_url,
        },
        ensure_ascii=False,
        indent=2,
    )

    base_context = f"""
[입력 메타]
{meta_block}

[제품/리뷰 요약]
{digest_brief}

[상위 상품 테이블 (Markdown)]
{top_table_md}
""".strip()

    prompts: Dict[str, str] = {}

    for key, title in SECTION_CONFIG:
        if key == "brand_summary":
            prompts[key] = f"""
당신은 뷰티 브랜드 컨설턴트입니다. 아래 정보를 바탕으로
'{title}' 섹션을 작성하세요.

- 인플루언서 채널/팬덤/시장 데이터를 한 장 요약하듯 정리합니다.
- Bullet 기반으로, 수치/팩트 위주로 작성하세요.

{base_context}
""".strip()
        elif key == "creator_analysis":
            prompts[key] = f"""
당신은 YouTube/SNS 크리에이터 분석 전문가입니다.
'{title}' 섹션에서는 인플루언서의 채널 특징, 팬덤 반응, 콘텐츠 톤을 분석합니다.

- 어떤 제품/이미지가 잘 맞는지,
- 팬덤 언어 패턴과 기대 이미지는 무엇인지
를 중심으로 정리하세요.

{base_context}
""".strip()
        else:
            prompts[key] = f"""
당신은 뷰티 브랜드 BM 컨설턴트입니다.
'{title}' 섹션을 작성하세요.

- 인플루언서 특성, 카테고리, 리뷰 데이터(상위 상품/성분)를 참고해
  이 섹션의 핵심 인사이트와 실행 아이디어를 제안합니다.
- Bullet 위주, 필요시 가벼운 소제목 사용.

{base_context}
""".strip()

    return prompts


def _extract_title_from_md(md: str, fallback: str) -> str:
    if not md:
        return fallback
    for line in md.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            line = line.lstrip("#").strip()
        return crop(line, 300)
    return fallback


def _make_section_json(key: str, title: str, md: str) -> Dict[str, Any]:
    return {
        "key": key,
        "title": title,
        "content_md": md,
    }


# -----------------------------------------------------------------------------
# 3. DF + request → report_BM 에 들어갈 컬럼 dict 생성
# -----------------------------------------------------------------------------
def build_bm_report_from_df(
    df: pd.DataFrame,
    request_obj: Any,
    channel_url: Optional[str],
    topn_ings: int = 15,
) -> Dict[str, Any]:
    """
    (DF는 이미 준비된 상태라고 가정한 버전)
    """
    # 필수 컬럼 채우기
    for c in ["product_id", "product_name", "key_ings", "summary3"]:
        if c not in df.columns:
            df[c] = ""
        df[c] = df[c].astype(str)

    if "score" not in df.columns:
        raise ValueError("DataFrame에 'score' 컬럼이 없습니다. (필수)")

    df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0.0)

    # 1) 요약
    digest = make_digest(df, topn=topn_ings)

    digest_brief = json.dumps(
        {
            "score_stats": digest.get("score_stats", {}),
            "tier_counts": digest.get("tier_counts", {}),
            "top_key_ings": digest.get("top_key_ings", [])[:12],
        },
        ensure_ascii=False,
        indent=2,
    )
    digest_brief = crop(digest_brief, 3000)
    top_table_md = crop(digest.get("top_products_table_md", ""), 2500)

    products_table_json = {
        "header": digest.get("top_products_table", [])[0]
        if digest.get("top_products_table")
        else [],
        "rows": digest.get("top_products_table", [])[1:]
        if digest.get("top_products_table")
        else [],
    }

    # 2) request 메타
    influencer_name: str = _get_attr(request_obj, "activity_name", "") or ""
    brand_concept: str = _get_attr(request_obj, "brand_concept", "") or ""
    category_code: str = _get_attr(request_obj, "category_code", "") or ""

    category_label: str = CATEGORY_LABEL_MAP.get(category_code, category_code)
    influencer_name = crop(influencer_name, 200)
    brand_concept_for_col = crop(brand_concept, 500)

    # 3) 프롬프트 + LLM
    prompts = make_prompts_for_bm(
        digest_brief=digest_brief,
        top_table_md=top_table_md,
        influencer_name=influencer_name,
        category_label=category_label,
        brand_concept=brand_concept,
        channel_url=channel_url,
    )

    sections_md: Dict[str, str] = {}
    for key, _title in SECTION_CONFIG:
        pr = prompts.get(key, "")
        sections_md[key] = llm_section(pr)

    brand_summary_md = sections_md.get("brand_summary", "")
    generated_ts_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report_title = _extract_title_from_md(
        brand_summary_md,
        fallback=f"{influencer_name} BM 리포트 ({category_label})",
    )

    full_markdown = "\n\n".join(
        [f"## {title}\n\n{sections_md.get(key, '')}" for key, title in SECTION_CONFIG]
    )

    # 4) 섹션 json
    section_json_map: Dict[str, Dict[str, Any]] = {}
    for key, title in SECTION_CONFIG:
        section_json_map[key] = _make_section_json(
            key=key,
            title=title,
            md=sections_md.get(key, ""),
        )

    # 5) contents 통합
    contents = {
        "meta": {
            "influencer_name": influencer_name,
            "brand_concept": brand_concept,
            "category_code": category_code,
            "category_label": category_label,
            "channel_url": channel_url,
            "generated_ts_str": generated_ts_str,
        },
        "digest": {
            "score_stats": digest.get("score_stats", {}),
            "tier_counts": digest.get("tier_counts", {}),
            "top_key_ings": digest.get("top_key_ings", [])[:12],
            "top_products_table_md": top_table_md,
        },
        "sections": section_json_map,
        "tables": {
            "products": products_table_json,
        },
    }

    # 6) report_BM 컬럼 dict 반환 (request_id, version 등은 바깥에서 세팅)
    col_values: Dict[str, Any] = {
        "influencer_name": influencer_name,
        "brand_concept": brand_concept_for_col,
        "channel_url": channel_url,
        "category_label": category_label,
        "generated_ts_str": generated_ts_str,
        "title": report_title,
        "summary_md": brand_summary_md,

        "brand_summary_json": section_json_map["brand_summary"],
        "creator_analysis_json": section_json_map["creator_analysis"],
        "market_landscape_json": section_json_map["market_landscape"],
        "concept_proposal_json": section_json_map["concept_proposal"],
        "product_line_json": section_json_map["product_line"],
        "segmentation_positioning_json": section_json_map["segmentation_positioning"],
        "brand_strategy_json": section_json_map["brand_strategy"],
        "channel_strategy_json": section_json_map["channel_strategy"],
        "financials_json": section_json_map["financials"],
        "conclusion_next_json": section_json_map["conclusion_next"],
        "appendix_json": section_json_map["appendix"],

        "competitors_table_json": None,
        "kpi_table_json": None,
        "products_table_json": products_table_json,
        "top_products_table_md": top_table_md,
        "full_markdown": full_markdown,

        "contents": contents,
    }

    return col_values


# -----------------------------------------------------------------------------
# 4. ★ 핵심: DB(request + oliveyoung_review) 기반으로 BM 리포트 생성/저장
# -----------------------------------------------------------------------------
def _fetch_oliveyoung_df_for_request(db: Session, request_obj: Request) -> pd.DataFrame:
    """
    request.category_code 에 해당하는 oliveyoung_review 를 가져와서
    DataFrame 형태로 반환.
    """
    category_code = request_obj.category_code

    q = (
        db.query(
            OliveyoungReview.product_id,
            OliveyoungReview.product_name,
            OliveyoungReview.score,
            OliveyoungReview.key_ings,
            OliveyoungReview.summary3,
            OliveyoungReview.category_code,
        )
        .filter(OliveyoungReview.category_code == category_code)
    )

    rows = q.all()
    if not rows:
        # 데이터가 없더라도 빈 DF를 리턴하고, LLM 쪽에서 "데이터 부족"을 언급하게 할 수도 있음
        return pd.DataFrame(
            columns=[
                "product_id",
                "product_name",
                "score",
                "key_ings",
                "summary3",
                "category_code",
            ]
        )

    df = pd.DataFrame(
        rows,
        columns=[
            "product_id",
            "product_name",
            "score",
            "key_ings",
            "summary3",
            "category_code",
        ],
    )
    return df


def build_bm_report_for_request(
    db: Session,
    request_id: int,
    channel_url: Optional[str] = None,
    topn_ings: int = 15,
) -> ReportBM:
    """
    1) request_id 로 request 행 조회
    2) request.category_code 에 맞는 oliveyoung_review 를 읽어 DataFrame 생성
    3) DF + request 정보로 report_BM 컬럼 dict 생성
    4) report_BM 레코드 생성/저장 후 반환
    """
    # 1) request 조회
    req = db.query(Request).filter(Request.request_id == request_id).first()
    if not req:
        raise ValueError(f"request_id={request_id} 에 해당하는 의뢰가 없습니다.")

    # 2) 카테고리 기준으로 oliveyoung_review → DF
    df = _fetch_oliveyoung_df_for_request(db, req)

    # 3) DF + request 로 report_BM 컬럼 dict 생성
    col_values = build_bm_report_from_df(
        df=df,
        request_obj=req,
        channel_url=channel_url,
        topn_ings=topn_ings,
    )

    # 4) version 결정 (해당 request의 기존 리포트 개수 + 1 예시)
    existing_count = (
        db.query(ReportBM)
        .filter(ReportBM.request_id == request_id)
        .count()
    )
    version = existing_count + 1

    report = ReportBM(
        request_id=request_id,
        version=version,
        **col_values,
    )

    db.add(report)
    db.commit()
    db.refresh(report)
    return report