import re, json, datetime
from collections import Counter
from typing import Any, Dict, List, Mapping, Optional

import pandas as pd
from sqlalchemy.orm import Session

from core.llm import llm_section
from models.request import Request
from models.oliveyoung_review import OliveyoungReview
from models.report_bm import ReportBM
from models.report_creator import ReportCreator
import markdown
import html
from scripts.skincare_focus_map import (
    SKINCARE_ING_DB,
    infer_focus_tags,
    infer_product_type,
)

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
    top = df.sort_values("score", ascending=False).head(max(10, topn))[cols].fillna("")

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
    topn_ings: int,
    blc_category: Optional[str] = None,
    blc_image: Optional[str] = None,
    blc_product_type: Optional[str] = None,
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

    # priority 계산 (리뷰수 × 긍정비율)
    if {"review_cnt", "share_pos"}.issubset(df.columns):
        df["review_cnt"] = pd.to_numeric(df["review_cnt"], errors="coerce").fillna(0).clip(0)
        df["share_pos"] = pd.to_numeric(df["share_pos"], errors="coerce").fillna(0.0)
        df["priority"] = df["review_cnt"].clip(lower=1) * df["share_pos"]
    else:
        df["priority"] = 0.0

    # 1) 요약
    digest = make_digest(df, topn=topn_ings)
    top_key_ings = digest.get("top_key_ings", [])
    top_tokens = [t["token"] for t in top_key_ings[:5]]  # 5~15개 적절히 조절 가능

    # priority 통계 및 Top10 테이블
    if df["priority"].sum() > 0:
        priority_stats = {
            "rows": int((df["priority"] > 0).sum()),
            "max": float(df["priority"].max()),
            "mean": float(df["priority"].mean()),
        }
        priority_cols = ["product_id", "product_name", "review_cnt", "share_pos", "priority"]
        priority_df = (
            df.sort_values("priority", ascending=False)
            .head(10)[priority_cols]
            .fillna("")
        )
        priority_rows = [priority_cols]
        for _, r in priority_df.iterrows():
            priority_rows.append(
                [
                    str(r["product_id"]),
                    str(r["product_name"]),
                    int(r["review_cnt"]),
                    f"{float(r['share_pos']):.3f}",
                    f"{float(r['priority']):.1f}",
                ]
            )
        priority_md = md_table_from_rows(priority_rows)
    else:
        priority_stats = {"rows": 0}
        priority_md = "우선순위 정보를 계산할 수 있는 리뷰 수/긍정 비율 데이터가 충분하지 않습니다."

    digest_brief_obj = {
        "score_stats": digest.get("score_stats", {}),
        "tier_counts": digest.get("tier_counts", {}),
        "top_key_ings": digest.get("top_key_ings", [])[:12],
        "top_tokens": top_tokens,
        "priority_stats": priority_stats,
    }
    digest_brief = json.dumps(digest_brief_obj, ensure_ascii=False, indent=2)
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
    REQUEST_CATEGORY = category_label
    REQUEST_CONCEPT = brand_concept
    INFLUENCER = influencer_name

    influencer_name = crop(influencer_name, 200)
    brand_concept_for_col = crop(brand_concept, 500)

    # 3) focus_tags / product_type 계산 (성분 + 카테고리 기반)
    focus_tags = infer_focus_tags(category_code, top_tokens)
    product_type = infer_product_type(category_code, focus_tags)

    # 4) BLC 정보 구성
    BLC_INFO: Dict[str, Any] = {
        "blc_category": blc_category,
        "image": blc_image,
        "product_type": product_type,
        "skincare_focus_tags": focus_tags,
        "top_ingredients": top_tokens,
    }
    blc_json_str = json.dumps(BLC_INFO, ensure_ascii=False, indent=2)

    # 5) 섹션별 프롬프트 (1119_bm_generator_final.py 기반)
    # 0) 데이터 개요
    p0 = f"""
제목: "# 0) 데이터 개요 및 분석 범위 (Data Overview)"

[데이터 요약(JSON)]
{digest_brief}

[상위 제품 테이블(score_100 기준)]
{top_table_md}

[우선순위 Top10 (리뷰량×긍정비율)]
{priority_md}

작성 지시:
- 이 데이터가 '올리브영 {REQUEST_CATEGORY} 카테고리에서 리뷰 수가 많고 평점이 높은 베스트셀러 TOP N'만 선별한 집단임을 명확히 설명하라.
- 각 제품은 리뷰 수가 매우 많고(예: 수천~1만 개 이상), 대부분 평점이 4.8~4.9 수준인 상위권 제품이라는 전제를 강조하라.
- score_100은 이 베스트셀러 그룹 내부에서 상대적인 차이를 보기 위한 지표이며,
  '좋다/나쁘다'가 아니라 '베스트 중에서도 더 강한 베스트'를 가르기 위한 점수라는 점을 설명하라.
- 티어는 S(90점 이상), A(75~89점), B(60~74점), C(60점 미만) 구간이지만,
  보고서의 핵심은 A티어 이상 제품들의 공통점을 파악해 새로운 제품 조건을 설계하는 것임을 3~4문장으로 서술하라.
- tier_counts 정보를 이용해 S/A 등급 제품 비중을 간단히 언급하되,
  평균·중앙값·표준편차 같은 통계 용어는 언급하지 말라.
- priority = review_cnt × share_pos 는 리뷰 볼륨과 긍정 비율을 함께 반영한 시장성 지표임을 설명하고,
  우선순위 Top10이 '가장 많이 팔리고 반응이 좋은 베스트셀러 핵심군'이라는 점을 한 문단으로 요약하라.
"""

    # 1) 브랜드 요약
    p1 = f"""
제목: "# 1) 브랜드 요약 (Brand Summary)"

[의뢰자 요청]
- 인플루언서: {INFLUENCER}
- 희망 카테고리: "{REQUEST_CATEGORY}"
- 희망 콘셉트: "{REQUEST_CONCEPT}"

[BLC 추천(JSON)]
{blc_json_str}

[데이터 요약(JSON)]
{digest_brief}

작성 지시:
- 의뢰자의 초기 요청(카테고리·콘셉트·브랜드 세계관)을 2~3문장으로 요약하라.
- BLC 추천 결과(데일리·입문자, 추천 이미지, 스킨케어 축, 추천 제품 유형)를 3~4문장으로 구체화하되,
  '의뢰자가 원하는 카테고리/콘셉트 안에서 가장 잘 맞는 방향'이라는 점을 분명히 하라.
- 이 보고서가 '베스트셀러 TOP N 중 A티어 이상 제품들의 공통점'을 기반으로
  인씨의 브랜드 조건을 설계하는 프로젝트라는 점을 분명히 밝혀라.
- tier_counts, top_ingredients, priority_stats에 있는 정보를 활용해,
  "현재 베스트셀러들이 공통적으로 가져가는 효능 축과 시장성 조건"을 요약하고
  왜 인씨에게 데일리·입문자용 진정/보습 축이 자연스러운지 3~5문장으로 설명하라.
- BLC 점수와 추천 방향은 크리에이터의 선택을 제한하거나 부정하는 것이 아니라,
  '이 방향으로 브랜딩하면 성공 확률이 더 높다'는 데이터 기반 근거라는 점을 한 문장으로 정리하라.
- 올리브영 리뷰 기반 BM이라는 점을 한 번 더 언급하라.
"""

    # 2) 시장 분석 (베스트셀러 집단의 공통 니즈)
    p2 = f"""
제목: "# 2) 시장 분석 (Market Landscape)"

[데이터 요약(JSON)]
{digest_brief}

[score 상위 제품 테이블]
{top_table_md}

[우선순위 Top10 테이블]
{priority_md}

작성 지시:

## 2-1. 베스트셀러 집단 정의
- "{REQUEST_CATEGORY}" 카테고리에서 이번 분석이 전체 제품이 아니라
  이미 '매출·리뷰·평점이 검증된 베스트셀러 상위군'만을 대상으로 한다는 점을 3~4문장으로 설명하라.
- 이 집단에서 B/C티어라 하더라도 전체 시장에서는 이미 상위권 제품이라는 점을 부가적으로 언급하라.

## 2-2. A티어 이상 제품의 공통점
- tier_counts를 활용하여 A/S 등급 제품들이 상당 부분을 차지한다는 전제를 깔고,
  A티어 이상 제품들의 공통된 포지션(피부 타입, 주요 니즈, 사용 상황 등)을 4~6문장으로 정리하라.
- score_100의 절대값을 품질 판단에 사용하지 말고,
  'A/S 구간 안에서 상대적으로 더 강한 포인트'만 언급하라.

## 2-3. 우선순위 제품 랭킹 분석
- priority = review_cnt × share_pos 의 의미를 다시 한 번 정리하고,
  Top10 표를 참고하여,
  - 리뷰 볼륨이 크면서 반응이 좋은 '카테고리 핵심 베스트셀러'
  - 리뷰는 상대적으로 적지만 share_pos가 매우 높아 성장 여지가 있는 '숨은 강자'
  같은 식으로 2~3 유형으로 나눠 불릿으로 설명하라.

## 2-4. 성분/니즈 관점 요약
- top_ingredients 정보를 활용해,
  진정, 보습, 장벽, 미백 등 주요 효능 축으로 묶어
  '베스트셀러가 공통적으로 가져가는 성분/효능 조합'을 5~7개 불릿으로 정리하라.
- 이때, 이후 BLC 추천 스킨케어 축( {BLC_INFO['skincare_focus_tags']} )과
  자연스럽게 연결될 수 있도록 서술하라.
"""

    # 3) BLC 기반 브랜드 전략
    p3 = f"""
제목: "# 3) BLC 기반 브랜드 전략 (Brand Strategy Based on BLC)"

[BLC 추천(JSON)]
{blc_json_str}

[데이터 요약(JSON)]
{digest_brief}

작성 지시:

## 3-1. 브랜드 이미지 & 톤
- "{BLC_INFO['image']}" 문장을 4~6문장으로 확장해, 구체적인 브랜드 이미지를 서술하라.
- 특히 '베스트셀러 상위 제품과 비슷한 신뢰감·안정감'과
  '인씨 채널만의 개성'이 동시에 느껴지도록 톤을 설계하라.
- 이때 BLC 추천 이미지는 크리에이터가 원하는 방향을 대체하는 것이 아니라,
  그 방향 안에서 '가장 잘 먹히는 표현 방식'을 제안하는 것임을 한 문장으로 명시하라.

## 3-2. 타깃 페르소나
- 올리브영에서 진정/보습 세럼을 사는 소비자를 1~2명 페르소나로 정의하고,
  각 페르소나를 불릿 6~8개로 정리하되,
  '이미 베스트셀러를 사용해 본 경험이 있고, 그보다 더 나은 조건을 찾는 소비자'라는 전제를 포함하라.
- 크리에이터의 채널 특성과 어울리는 부분(예: 피부 타입, 고민, 라이프스타일)을 함께 언급하라.

## 3-3. 톤앤매너 가이드
- 언어 톤, 비주얼 톤, 커뮤니케이션 방식(영상/썸네일/카피)을 불릿 6~10개로 제안하되,
  데일리·입문자, 진정/보습 축, 민감피부 안심감, '베스트셀러 수준의 신뢰도'를 키워드로 삼아라.
- BLC가 제안하는 방향을 그대로 따르기보다는,
  크리에이터가 원래 하고 싶어 하던 이미지/톤을 강화하는 보완 장치로 설명하라.
"""

    # 4) 제품 전략 (콘셉트별 스코어링 100점 만점)
    p4 = f"""
제목: "# 4) 제품 전략 및 콘셉트 스코어링 (Product Strategy & Concept Scoring)"

[의뢰자 콘셉트] {REQUEST_CONCEPT}
[BLC 추천 제품 유형] {BLC_INFO['product_type']}
[BLC 추천 스킨케어 축] {BLC_INFO['skincare_focus_tags']}

[데이터 요약(JSON)]
{digest_brief}

작성 지시:

## 4-1. 콘셉트 후보 3개 정의
- ① 의뢰자 콘셉트(하루 피로를 녹이는 진정/보습 세럼)
- ② BLC 기준 '데일리 진정/보습 입문 세럼'
- ③ 장벽/민감 케어에 조금 더 집중한 대안 콘셉트
를 각각 2~3문장으로 설명하라.
- 이때 ①번 의뢰자 콘셉트를 '기본 축'으로 두고,
  ②, ③은 이 기본 축을 어떻게 보완/확장할 수 있는지 관점에서 서술하라.

## 4-2. 콘셉트별 예상 성과 스코어링 (0~100점)
- 아래 형식의 표를 작성하라:

| 콘셉트안 | 리뷰-니즈 적합도(점/100) | 성분/태그 정합도(점/100) | 우선순위 베스트셀러 대비 차별성(점/100) | 예상 종합 점수(점/100) |

- 점수는 상대 비교용으로 0~100 범위에서 설정하되,
  '리뷰-니즈 적합도'는 top_ingredients와 tier_counts에서 드러나는
  베스트셀러 공통 니즈(진정/보습/민감 등)에 얼마나 잘 맞는지를 기준으로 설정하라.
- '성분/태그 정합도'는 top_ingredients와 BLC 스킨케어 축( {BLC_INFO['skincare_focus_tags']} )에
  얼마나 잘 맞는지를 기준으로 점수를 설정하라.
- '우선순위 베스트셀러 대비 차별성'은 priority Top10의 주요 타입과 비교했을 때
  얼마나 다른 포지션(예: 사용감, 성분 조합, 이미지)을 가져갈 수 있는지를 기준으로 점수를 설정하라.
- 표 아래에, 각 점수를 어떤 논리(성분 비율/priority/상위 베스트셀러 공통점)에 따라 매겼는지 4~6문장으로 설명하라.

## 4-3. 우선 출시 제품 제안
- 위 스코어링을 토대로 최우선 출시 콘셉트를 1개 선택하고,
  그 이유를 4~6문장으로 정리하되,
  '베스트셀러 A티어 이상 공통점'을 얼마나 충족하는지와
  'S티어 수준까지 끌어올릴 수 있는 여지'를 함께 언급하라.
- 최종 제안은 항상 크리에이터가 원하는 방향(①번 콘셉트)을 기본 축으로 존중하면서,
  BLC와 리뷰 데이터가 왜 그 선택을 뒷받침하는지 설명하는 방식으로 작성하라.
"""

    # 5) 가격 전략 (성분 원가까지 고려한 가격대 제안)
    p5 = f"""
제목: "# 5) 가격 전략 (Price Strategy)"

[데이터 요약(JSON)]
{digest_brief}

작성 지시:
- 현재 데이터에는 실제 가격 정보가 없으므로, 가격 관련 정량 분석이 불가능하다는 점을 먼저 명시하라.
- 대신 올리브영 내 일반적인 가격대 구간(예: 1만~2만 / 2만~3만 / 3만~5만 / 5만 이상)을 가정하고,
  각 구간이 어떤 타깃/기대치에 맞는지 서술형으로 설명하라.
- 베스트셀러 상위 제품들의 성분 조합을 상식적으로 해석하여,
  일반적으로 원가가 높은 성분(예: 펩타이드, 세라마이드, 레티놀, 고함량 나이아신아마이드, 특수 추출물 등)과
  기본 보습 베이스(글리세린, BG, 기본 보습 오일 등)를 구분하라.
- 이를 바탕으로, 인씨가 제안할 제품에 대해
  ① '성분 퀄리티(고가 성분 포함 여부)'와
  ② '베스트셀러 포지션(대중적인가, 프리미엄인가)'
  를 함께 고려한 적정 가격대 구간을 4~6문장으로 제안하라.
- 크리에이터가 원하는 브랜드 이미지(입문자 친화/프리미엄/전문성 등)를 우선 존중하되,
  그 이미지와 성분·시장 포지션이 자연스럽게 맞는 가격대 구간을 제안하는 방식으로 서술하라.
- 구체적인 숫자(정가, 마진, 단가)를 새로 만들어내지 말고,
  '1만 후반~2만 초반', '3만 중후반'과 같은 구간 단위 표현만 사용하라.
"""

    # 6) 의사결정 로그 (데이터 인용 극대화)
    p6 = f"""
제목: "# 6) 의사결정 로그 (Decision Log)"

[의뢰자 요청]
- 카테고리: {REQUEST_CATEGORY}
- 콘셉트: {REQUEST_CONCEPT}

[BLC 추천(JSON)]
{blc_json_str}

[데이터 요약(JSON)]
{digest_brief}

[상위 score_100 테이블]
{top_table_md}

[우선순위 Top10 테이블]
{priority_md}

작성 지시:

## 6-1. 텍스트 로그
- 각 줄을 아래 형식으로 8~12개 작성하라:
  - "요청: ~ / 데이터: ~ / 판단: ~ / 결과: ~"
- 데이터 부분에는 tier_counts, top_ingredients, priority_stats, 우선순위 Top10에서 가져온 실제 숫자(점수/비율/순위)를 넣어라.
- 예: "요청: 진정/보습 세럼 / 데이터: 분석 대상 20개 전부가 베스트셀러이며, 이 중 S·A티어가 15개 이상을 차지하고 진정·보습 계열 성분이 상위 성분의 70% 이상을 차지함 / 판단: 인씨가 원하는 '하루 피로를 녹이는 진정/보습' 콘셉트는 베스트셀러 니즈와 높은 정합성을 보임 / 결과: 데일리 진정·보습 축을 유지하되 장벽·민감 포인트를 추가 강화하기로 결정."

## 6-2. 요약 의사결정 표
- 아래 형식의 표를 작성하라:

| 항목 | 의뢰자 초기 안 | 데이터 인사이트 | 최종 제안 방향 |

- 항목 예시:
  - 카테고리 포지션
  - 핵심 효능/니즈
  - 스킨케어 축(진정/보습/장벽 등)
  - 우선 출시 제품 콘셉트
  - 가격대(구간 수준)
  - 리스크 회피 포인트(민감/자극 등)
- 각 항목에서 '의뢰자 초기 안'을 기준으로,
  데이터가 어떻게 그 선택을 보완/강화했는지에 초점을 맞춰 작성하라.
"""

    # 7) 부록
    pA = f"""
제목: "# 📎 부록 (Appendix)"

[데이터 요약(JSON)]
{digest_brief}

[상위 제품 테이블]
{top_table_md}

[우선순위 Top10]
{priority_md}

작성 지시:

## A-1. 성분/키워드 요약
- top_ingredients를 이용해, 자주 등장하는 성분/효능 키워드를 6~10개 불릿으로 요약하라.

## A-2. 성분 비율 표
- 아래 형식의 표를 작성하라:

| 성분 키워드 | 제품 포함 비율(%) | 효능 축(진정/보습/장벽/미백 등) | 코멘트 |

- 이때, '베스트셀러 상위군에서 필수처럼 등장하는 성분'과
  '상대적으로 차별성을 만드는 성분'을 구분해서 코멘트를 달아라.

## A-3. 우선순위 제품 요약
- 우선순위 Top10을 보고, 3~5개 정도의 대표 제품 타입(예: 대형 진정토너, 고보습 토너, 프리미엄 장벽케어 등)으로 묶어 설명하라.
"""

    # 6) LLM 호출
    sections_md: Dict[str, str] = {}
    for label, key, pr in [
        ("0) 데이터 개요", "data_overview", p0),
        ("1) 브랜드 요약", "brand_summary", p1),
        ("2) 시장 분석", "market_analysis", p2),
        ("3) BLC 기반 브랜드 전략", "blc_strategy", p3),
        ("4) 제품 전략", "product_strategy", p4),
        ("5) 가격 전략", "price_strategy", p5),
        ("6) 의사결정 로그", "decision_log", p6),
        ("부록", "appendix", pA),
    ]:
        print(f"[MAKE] {label}")
        sections_md[key] = llm_section(pr)

    brand_summary_md = sections_md.get("brand_summary", "")
    generated_ts_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report_title = _extract_title_from_md(
        brand_summary_md,
        fallback=f"{influencer_name} BM 리포트 ({category_label})",
    )

    # full markdown (헤더 + 섹션들)
    header = f"""
# {INFLUENCER} — {REQUEST_CATEGORY} BM 보고서  
- 의뢰자 요청 카테고리: {REQUEST_CATEGORY}  
- 의뢰자 콘셉트: {REQUEST_CONCEPT}  
- 분석 대상: 올리브영 {REQUEST_CATEGORY} 베스트셀러 TOP N (리뷰 수가 많고 평점이 높은 상위 제품)  
- 분석 관점: 베스트셀러 중 A티어 이상 제품들의 공통점을 바탕으로 인씨 전용 제품 조건·성분·가격대를 설계  
- 전략 원칙: 크리에이터의 요청을 최우선으로 존중하고, BLC 점수와 리뷰 데이터는 그 선택을 강화하는 데이터 가이드로 사용  
- BLC 추천 카테고리: {BLC_INFO['blc_category']}  
- BLC 추천 이미지: {BLC_INFO['image']}  
- 데이터 출처: 올리브영 제품·리뷰 분석 (explanations_topN + product_reviews_ingredients priority)  
- 생성 시각: {generated_ts_str}  
"""

    full_markdown = header + "\n\n---PAGE---\n\n".join(
        [
            sections_md.get("data_overview", ""),
            sections_md.get("brand_summary", ""),
            sections_md.get("market_analysis", ""),
            sections_md.get("blc_strategy", ""),
            sections_md.get("product_strategy", ""),
            sections_md.get("price_strategy", ""),
            sections_md.get("decision_log", ""),
            sections_md.get("appendix", ""),
        ]
    )

    # 7) 섹션 json
    section_json_map: Dict[str, Dict[str, Any]] = {
        "data_overview": _make_section_json("data_overview", "0) 데이터 개요", sections_md.get("data_overview", "")),
        "brand_summary": _make_section_json("brand_summary", "1) 브랜드 요약", sections_md.get("brand_summary", "")),
        "market_analysis": _make_section_json("market_analysis", "2) 시장 분석", sections_md.get("market_analysis", "")),
        "blc_strategy": _make_section_json("blc_strategy", "3) BLC 기반 브랜드 전략", sections_md.get("blc_strategy", "")),
        "product_strategy": _make_section_json("product_strategy", "4) 제품 전략", sections_md.get("product_strategy", "")),
        "price_strategy": _make_section_json("price_strategy", "5) 가격 전략", sections_md.get("price_strategy", "")),
        "decision_log": _make_section_json("decision_log", "6) 의사결정 로그", sections_md.get("decision_log", "")),
        "appendix": _make_section_json("appendix", "부록", sections_md.get("appendix", "")),
    }

    # 8) contents 통합
    contents = {
        "meta": {
            "influencer_name": influencer_name,
            "brand_concept": brand_concept,
            "category_code": category_code,
            "category_label": category_label,
            "channel_url": channel_url,
            "generated_ts_str": generated_ts_str,
            "blc_matching": {
                "category": blc_category,
                "image": blc_image,
                "product_type": product_type,
                "skincare_focus_tags": focus_tags,
            },
        },
        "digest": digest_brief_obj,
        "sections": section_json_map,
        "tables": {
            "products": products_table_json,
            "priority_top10_md": priority_md,
        },
    }

    # 9) report_BM 컬럼 dict 반환 (request_id, version 등은 바깥에서 세팅)
    col_values: Dict[str, Any] = {
        "influencer_name": influencer_name,
        "brand_concept": brand_concept_for_col,
        "channel_url": channel_url,
        "category_label": category_label,
        "generated_ts_str": generated_ts_str,
        "title": report_title,
        "summary_md": brand_summary_md,
        "data_overview_json": section_json_map["data_overview"],
        "brand_summary_json": section_json_map["brand_summary"],
        "market_analysis_json": section_json_map["market_analysis"],
        "blc_strategy_json": section_json_map["blc_strategy"],
        "product_strategy_json": section_json_map["product_strategy"],
        "price_strategy_json": section_json_map["price_strategy"],
        "decision_log_json": section_json_map["decision_log"],
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
# 4. channel_name → channel_url 매핑 헬퍼
# -----------------------------------------------------------------------------
def resolve_channel_url_from_request(
    db: Session,
    request_obj: Request,
) -> Optional[str]:
    """
    Request의 channel_name 등을 이용해 channel_url을 찾아오는 헬퍼.

    지금은 템플릿 형태로 두고,
    - 나중에 creator_channel 테이블,
    - 혹은 YouTube API/기타 매핑 로직
    을 붙일 때 이 함수만 수정하면 되도록 분리해 둠.
    """
    # 1) Request에 channel_url 컬럼이 나중에 생기면 우선 사용
    if hasattr(request_obj, "channel_url"):
        url = getattr(request_obj, "channel_url", None)
        if url:
            return url

    channel_name = getattr(request_obj, "channel_name", None)
    if not channel_name:
        return None

    # TODO: 실제 매핑 로직 구현
    return None


# -----------------------------------------------------------------------------
# 5. DB(request + oliveyoung_review) 기반으로 BM 리포트 생성/저장
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
            OliveyoungReview.review_cnt,
            OliveyoungReview.share_pos,
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
                "review_cnt",
                "share_pos",
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
            "review_cnt",
            "share_pos",
        ],
    )
    return df


def build_bm_report_for_request(
    db: Session,
    request_id: int,
    creator_report: Optional[ReportCreator] = None,
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

    # 2) creator_report 없으면 DB에서 조회
    if creator_report is None:
        creator_report = (
            db.query(ReportCreator)
            .filter(ReportCreator.request_id == request_id)
            .order_by(ReportCreator.version.desc())
            .first()
        )
    if creator_report is None:
        raise ValueError("BM 보고서 생성 전, 크리에이터 분석 보고서가 반드시 필요합니다.")

    # 3) Creator 분석 결과(BLC 매칭) 추출
    blc_matching = creator_report.blc_matching_json or {}
    if creator_report.blc_matching_json:
        blc_matching = creator_report.blc_matching_json

    matched_category = (
        blc_matching.get("matching", {}).get("category")
        or blc_matching.get("category")  # 혹시나 구버전 대비
    )

    matched_image = (
        blc_matching.get("matching", {}).get("image")
        or blc_matching.get("image")
    )

    matched_product_type = (
        blc_matching.get("matching", {}).get("product_type")
        or blc_matching.get("product_type")
    )

    # 4) 올리브영 DF 가져오기
    df = _fetch_oliveyoung_df_for_request(db, req)

    # 5) channel_name → url
    channel_url = resolve_channel_url_from_request(db, req) or ""

    # 6) BM 생성 dict 만들기
    col_values = build_bm_report_from_df(
        df=df,
        request_obj=req,
        channel_url=channel_url,
        topn_ings=topn_ings,
        blc_category=matched_category,
        blc_image=matched_image,
        blc_product_type=matched_product_type,
    )

    # 7) version
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


# -----------------------------------------------------------------------------
# 6. 필요한 부분만 JSON >> HTML 전환
# -----------------------------------------------------------------------------
# 섹션 출력 순서 고정 (원하는 순서대로)
SECTION_ORDER = [
    "data_overview",     # 0. 데이터 개요
    "brand_summary",     # 1. 브랜드 요약
    "market_analysis",   # 2. 시장 분석
    "blc_strategy",      # 3. BLC 기반 브랜드 전략
    "product_strategy",  # 4. 제품 전략
    "price_strategy",    # 5. 가격 전략
    "decision_log",      # 6. 의사결정 로그
    "appendix",          # 부록
]


def render_bm_sections_html(sections: dict) -> str:
    """
    sections JSON(dict) 을 받아서 BM 리포트용 HTML 문자열로 변환.
    - 각 섹션을 <section> 블록으로 묶고
    - title은 <h2>, content_md는 markdown → HTML 로 변환
    """
    html_parts: List[str] = []

    for key in SECTION_ORDER:
        sec = sections.get(key)
        if not sec:
            continue

        title = sec.get("title") or ""
        content_md = sec.get("content_md") or ""

        # Markdown → HTML
        body_html = markdown.markdown(
            content_md,
            extensions=["extra", "sane_lists"],
        )

        block = f"""
        <section class="bm-section bm-section--{html.escape(key)}">
          <h2 class="bm-section__title">{html.escape(title)}</h2>
          <div class="bm-section__body">
            {body_html}
          </div>
        </section>
        """
        html_parts.append(block)

    return "\n".join(html_parts)
