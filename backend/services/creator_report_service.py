# services/creator_report_service.py
import os
import re
from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, Optional
from openai import OpenAI
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.request import Request
from models.report_creator import ReportCreator
from youtube_data_collector import YouTubeDataCollector
from youtube_metrics_calculator_v2 import MetricsCalculator
##----------------------------근서 코드 넣기---------------------------------------------

# -----------------------------------------
# OpenAI 클라이언트 (모듈 전역에서 재사용)
# -----------------------------------------
_openai_client: Optional[OpenAI] = None

def _get_openai_client() -> Optional[OpenAI]:
    global _openai_client
    if _openai_client is not None:
        return _openai_client

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("[CreatorReport] ❌ OPENAI_API_KEY 가 설정되어 있지 않습니다.")
        return None

    try:
        _openai_client = OpenAI(api_key=api_key, timeout=60.0)
        print("[CreatorReport] OpenAI 클라이언트 초기화 성공")
    except Exception as e:
        print(f"[CreatorReport] ❌ OpenAI 클라이언트 초기화 실패: {e}")
        _openai_client = None
    return _openai_client


def _call_openai_simple(prompt: str, max_tokens: int = 2000) -> Optional[str]:
    """노트북에서 쓰던 OpenAI 호출 함수 (섹션별 LLM 생성용)"""
    client = _get_openai_client()
    if client is None:
        return None

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini-2024-07-18",   # 노트북에서 쓰던 기본 모델
            messages=[
                {
                    "role": "system",
                    "content": (
                        "당신은 YouTube 크리에이터 분석 전문가입니다. "
                        "데이터 기반으로 통찰력 있고 실행 가능한 보고서를 작성합니다."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=max_tokens,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"[CreatorReport] ❌ OpenAI 호출 오류: {e}")
        return None

def _generate_creator_report_section(
    section_name: str,
    metrics: Dict[str, Any],
    request_info: Dict[str, Any],
) -> str:
    """
    노트북 V2.1에서 사용하던 섹션별 프롬프트 + LLM 호출
    - metrics: MetricsCalculator.generate_summary_report() 결과
    - request_info: brand_concept 등 추가 정보 (지금은 brand_concept 정도)
    """
    perf = metrics.get("performance_profile", {}) or {}
    format_effects = metrics.get("format_effects", {}) or {}
    consistency = metrics.get("upload_consistency", {}) or {}
    blc_breakdown = metrics.get("blc_breakdown", {}) or {}
    raw_values = metrics.get("raw_values", {}) or {}
    tier = metrics.get("tier", "N/A")

    # 포맷 효과 텍스트 (노트북과 동일)
    format_info = ""
    if format_effects:
        format_info = "### 포맷별 효과 (상대적 개선률)\n"
        for fmt_name, fmt_data in format_effects.items():
            fmt_label = {
                "before_after": "Before/After",
                "howto": "How-to",
                "review": "Review",
            }.get(fmt_name, fmt_name)

            format_info += (
                f"- **{fmt_label}**: {fmt_data.get('improvement_pct', 0):.1f}% 개선 "
                f"(있음: {fmt_data.get('engagement_with', 0):.1f}, "
                f"없음: {fmt_data.get('engagement_without', 0):.1f})\n"
            )
    else:
        format_info = "포맷 효과 분석 데이터 없음"

    prompts = {
        "executive_summary": f"""
YouTube 채널 '{metrics.get('channel_name', 'N/A')}'의 분석 결과를 한 장으로 요약해주세요.

## 채널 정보
- Tier: {tier}
- 구독자: {metrics.get('subscriber_count', 'N/A')}
- BLC 점수: {metrics.get('blc_score', 0)}/100 (등급: {metrics.get('verdict', 'N/A')})

## 핵심 지표 (Tier 대비 상대 점수, 100점 만점)
- Engagement 점수: {blc_breakdown.get('engagement_score', 0):.1f}/100 (실제: {raw_values.get('engagement_median', 0):.2f} per 1K)
- Views 점수: {blc_breakdown.get('views_score', 0):.1f}/100 (실제: {raw_values.get('views_per_day_median', 0):.1f} views/day)
- Demand 점수: {blc_breakdown.get('demand_score', 0):.1f}/100 (실제: {raw_values.get('demand_index_median', 0):.2f})
  * Demand: 조회수 1000당 구매/사용 인증 댓글 수 (예: "구매했어요", "써봤어요", "만족", "재구매")
- Problem 점수 (고민 해결 수요): {blc_breakdown.get('problem_score', 0):.1f}/100 (실제: {raw_values.get('problem_rate_median', 0)*100:.2f}%)
  * Problem: 댓글 중 피부 고민 언급 비율 (높을수록 기능성 제품 수요 존재)
- Format 점수: {blc_breakdown.get('format_score', 0):.1f}/100
  * V2.1: Before/After, How-to, Review 3가지 포맷만 분석 (Comparison 제외)
- Consistency 점수: {blc_breakdown.get('consistency_score', 0):.1f}/100 (실제: {raw_values.get('videos_per_week', 0):.2f}회/주)

## 포맷 효과 (상대적 개선률 방식)
{format_info}

투자자/브랜드가 3분 안에 이해할 수 있도록:
1. 결론 및 추천 (등급 기준)
2. 핵심 강점 (점수 80~100점대 지표 중심)
3. 개선 영역 (점수 60점 미만 지표 중심)
4. Tier 내 상대적 위치 해석
5. Demand와 Problem 조합이 시사하는 타겟 오디언스 특성
6. Format 효과 요약 (상대적 개선률 기준)

구체적인 수치를 인용하며 작성해주세요.
""",
        "deep_analysis": f"""
YouTube 채널 '{metrics.get('channel_name', 'N/A')}'의 심층 분석을 작성해주세요.

## Tier 정보
- 채널 Tier: {tier}
- 이 Tier의 평균적인 채널과 비교한 상대 점수입니다 (100점 만점).

## BLC 점수 상세
- 전체: {metrics.get('blc_score', 0)}/100 (등급: {metrics.get('verdict', 'N/A')})
- Engagement: {blc_breakdown.get('engagement_score', 0):.1f}/100 (가중치 30%)
- Views: {blc_breakdown.get('views_score', 0):.1f}/100 (가중치 25%)
- Demand: {blc_breakdown.get('demand_score', 0):.1f}/100 (가중치 15%)
- Problem (고민 해결 수요): {blc_breakdown.get('problem_score', 0):.1f}/100 (가중치 10%)
- Format: {blc_breakdown.get('format_score', 0):.1f}/100 (가중치 10%)
- Consistency: {blc_breakdown.get('consistency_score', 0):.1f}/100 (가중치 10%)

## 실제 측정값
- Engagement: {raw_values.get('engagement_median', 0):.2f} per 1K views
- Views/day: {raw_values.get('views_per_day_median', 0):.1f}
- Demand Index: {raw_values.get('demand_index_median', 0):.2f} (조회수 1000당 구매/사용 인증 댓글)
- Problem Rate: {raw_values.get('problem_rate_median', 0)*100:.2f}% (고민 언급 댓글 비율)
- Videos/Week: {raw_values.get('videos_per_week', 0):.2f}회

## 포맷 효과 (V2.1: 상대적 개선률)
{format_info}

### 중요 해석 가이드:
**Demand 지표**: 
- "구매했어요", "써봤어요", "만족", "재구매" 등 실제 행동/긍정 반응 댓글
- 높을수록 시청자의 구매 전환력 우수
- 낮으면 콘텐츠는 좋지만 제품 판매로 이어지지 않을 위험

**Problem 지표**:
- "여드름", "민감", "건조", "고민" 등 피부 문제 언급 댓글
- 뷰티에서는 긍정 지표: 높을수록 기능성 제품 수요 존재
- 낮으면 일반 뷰티 관심층, 높으면 문제 해결 솔루션 찾는 층

**Format 점수 (V2.1 변경사항)**:
- Comparison(비교) 포맷 제외 (뷰티에서 효과 미미)
- Before/After, How-to, Review 3가지만 분석
- 상대적 개선률 방식: (포맷 있을 때 - 없을 때) / 없을 때 × 100%
- 50% 개선 = 100점 기준

다음을 포함해주세요:
1. 각 점수가 높은/낮은 이유 (Tier 평균 대비)
2. 압도적 강점 (80+ 점수)과 활용 전략
3. 개선 영역 (50 미만 점수)과 구체적 방법
4. Demand/Problem 조합 해석:
   - 둘 다 높음: 문제 해결 제품 최적 (기능성 크림, 세럼)
   - Demand 높고 Problem 낮음: 트렌드 제품 최적 (컬러, 신제품)
   - Demand 낮고 Problem 높음: 교육 콘텐츠 강화 필요
5. Format 효과 해석 (상대적 개선률 기준)
   - 어떤 포맷이 몇 % 효과적인지
   - 샘플 수가 충분한지 (신뢰도 평가)

실무자가 바로 적용할 수 있는 인사이트를 제공해주세요.
""",
        "risk_mitigation": f"""
YouTube 채널 '{metrics.get('channel_name', 'N/A')}'의 리스크를 분석하고 대응 방안을 제시해주세요.

## 현재 상태
- BLC: {metrics.get('blc_score', 0)}/100 (등급: {metrics.get('verdict', 'N/A')})
- Tier: {tier}
- Engagement 점수: {blc_breakdown.get('engagement_score', 0):.1f}/100
- Views 점수: {blc_breakdown.get('views_score', 0):.1f}/100
- Demand 점수: {blc_breakdown.get('demand_score', 0):.1f}/100
  * Demand가 낮으면: 구매 전환 실패 리스크
- Problem 점수: {blc_breakdown.get('problem_score', 0):.1f}/100
  * Problem이 낮으면: 기능성 제품 수요 부족
- Format 점수: {blc_breakdown.get('format_score', 0):.1f}/100
- Consistency: {blc_breakdown.get('consistency_score', 0):.1f}/100

## 포맷 효과
{format_info}

최소 3가지 리스크를 식별하고, 각각에 대해:
1. 리스크명
2. 관찰 근거 (Tier 대비 낮은 점수 등)
3. 즉시 실행 가능한 대응책
4. 성공 지표

### 리스크 식별 가이드:
**Demand 관련**:
- 50점 미만: "구매 전환 부재" 리스크
  → 대응: CTA 강화, 제품 링크 추가, 사용 후기 유도
  
**Problem 관련**:
- 너무 낮음(<30): "니치 타겟팅 실패" 리스크 (기능성 제품 부적합)
  → 대응: 고민 해결 콘텐츠 추가 OR 일반 뷰티 제품 집중
  
**Format 관련 (V2.1)**:
- Before/After 개선률 낮음: "시각적 증거 부족" 리스크
- How-to 개선률 낮음: "실용성 부족" 리스크
- Review 개선률 낮음: "신뢰도 부족" 리스크
  → 각 포맷별 맞춤 대응 제시

특히 50점 미만인 지표를 중심으로 분석해주세요.
""",
    }

    if section_name not in prompts:
        return f"[{section_name} 섹션 생성 실패: 프롬프트 없음]"

    result = _call_openai_simple(prompts[section_name])
    return result if result else f"[{section_name} 생성 실패]"

def _run_creator_pipeline_core(
    channel_query: str,
    brand_concept: str,
    analysis_period_months: int = 6,
) -> Dict[str, Any]:
    """
    노트북 run_full_pipeline() 의 핵심 로직.
    - YouTubeDataCollector + MetricsCalculator 사용
    - 파일 저장 없이 metrics/섹션 텍스트/매칭 정보만 반환
    """
    youtube_api_key = os.getenv("YOUTUBE_API_KEY")
    if not youtube_api_key:
        raise RuntimeError("YOUTUBE_API_KEY 가 설정되어 있지 않습니다.")

    print("\n" + "=" * 80)
    print("🚀 YouTube Creator Analysis V2.1 - Tier 기반 상대평가")
    print("=" * 80)
    print(f"채널 쿼리: {channel_query}")
    print(f"분석 기간: 최근 {analysis_period_months}개월\n")

    collector = YouTubeDataCollector(youtube_api_key)

    # STEP 1: 채널 ID 확인
    channel_id = channel_query
    if not channel_query.startswith("UC"):
        print("  [Pipeline] 채널 ID 검색 시도...")
        channel_id = collector.get_channel_id_from_username(channel_query)

    if not channel_id:
        raise RuntimeError(f"채널 ID를 찾을 수 없습니다: {channel_query}")

    print(f"  ✅ 채널 ID: {channel_id}")

    # STEP 2: YouTube 데이터 수집
    print("\n[STEP 2/4] 📊 YouTube 데이터 수집 중...")
    raw_data = collector.collect_full_data(
        channel_id=channel_id,
        max_videos=100,
        months_back=analysis_period_months,
    )
    if not raw_data or not raw_data.get("channel"):
        raise RuntimeError(f"YouTube 데이터 수집 실패: {channel_id}")

    print(f"  ✅ 채널: {raw_data['channel']['channel_name']}")
    print(f"  ✅ 영상: {len(raw_data['videos'])}개")

    if len(raw_data["videos"]) == 0:
        raise RuntimeError("수집된 영상이 0개입니다.")

    # STEP 3: 지표 계산
    print("\n[STEP 3/4] 📈 지표 계산 중... (V2.1: Format Score 수정)")
    calculator = MetricsCalculator(raw_data)
    metrics = calculator.generate_summary_report()
    if not metrics or "blc_score" not in metrics:
        raise RuntimeError("지표 계산 실패")

    blc_bd = metrics.get("blc_breakdown", {})
    print(f"  ✅ BLC: {metrics['blc_score']}/100 ({metrics['verdict']})")
    print(f"  ✅ Tier: {metrics['tier']}")
    print(
        f"  ✅ 핵심 점수: Eng {blc_bd.get('engagement_score', 0):.0f}, "
        f"Views {blc_bd.get('views_score', 0):.0f}, "
        f"Demand {blc_bd.get('demand_score', 0):.0f}"
    )

    # STEP 4: LLM 보고서 섹션 생성
    print("\n[STEP 4/4] 🤖 LLM 보고서 생성 중...")
    request_info = {"brand_concept": brand_concept}
    sections: Dict[str, str] = {}

    for key, label in [
        ("executive_summary", "한 장 요약"),
        ("deep_analysis", "심층 분석"),
        ("risk_mitigation", "리스크 대응"),
    ]:
        print(f"  📝 {label} 섹션 생성 중...")
        text = _generate_creator_report_section(key, metrics, request_info)
        sections[key] = text

    # BLC 매칭 섹션 텍스트
    blc_matching = metrics.get("blc_matching", {}) or {}
    blc_bd = metrics.get("blc_breakdown", {}) or {}
    blc_matching_section = f"""
**채널 Tier:** {metrics.get('tier', 'N/A')}

**적합 카테고리:** {blc_matching.get('category', 'N/A')}

**적합 이미지:** {blc_matching.get('image', 'N/A')}

**적합 스킨케어:** {blc_matching.get('skincare', 'N/A')}

**적합 제품 유형:** {blc_matching.get('product_type', 'N/A')}

---
**알고리즘 근거 (Tier 대비 상대 점수, 100점 만점):**
- Engagement: {blc_bd.get('engagement_score', 0):.1f}/100
- Views: {blc_bd.get('views_score', 0):.1f}/100
- Demand: {blc_bd.get('demand_score', 0):.1f}/100 (구매/사용 인증 댓글)
- Problem: {blc_bd.get('problem_score', 0):.1f}/100 (고민 해결 수요)

**등급:** {metrics.get('verdict', 'N/A')}
""".strip()

    # 전체 리포트 마크다운 (필요하면 나중에 사용)
    full_report_md = f"""
# 크리에이터 분석 보고서 V2.1

**채널:** {metrics['channel_name']}  
**생성일:** {datetime.now().strftime('%Y년 %m월 %d일')}  
**BLC 점수:** {metrics['blc_score']}/100  
**등급:** {metrics['verdict']}  
**Tier:** {metrics['tier']}

---
## 1. 한 장 요약 (Executive Summary)
{sections.get('executive_summary', '[생성 실패]')}

---
## 2. 채널 심층 분석 (Deep Analysis)
{sections.get('deep_analysis', '[생성 실패]')}

---
## 3. BLC 매칭 (Brand-Category Matching)
{blc_matching_section}

---
## 4. 리스크 & 대응 (Risk & Mitigation)
{sections.get('risk_mitigation', '[생성 실패]')}
""".strip()

    return {
        "channel_id": channel_id,
        "metrics": metrics,
        "sections": sections,
        "blc_matching_section": blc_matching_section,
        "full_report_md": full_report_md,
    }

def _parse_verdict(verdict: str) -> tuple[str, str]:
    """
    예시:
      'B (조건부 Go)' -> ('B', '조건부 Go')
      'S (즉시 Go)'   -> ('S', '즉시 Go')
    """
    if not verdict:
        return "", ""
    m = re.match(r"\s*([SABCD])\s*\((.+)\)\s*", verdict)
    if not m:
        return verdict, ""
    return m.group(1), m.group(2)

def build_creator_report_for_request(
    db: Session,
    request_id: int,
) -> ReportCreator:
    """
    request_id 기준으로 YouTube 크리에이터 분석 리포트 생성 후
    report_creator 테이블에 저장하고 객체를 반환.
    """
    req: Optional[Request] = (
        db.query(Request)
        .filter(Request.request_id == request_id)
        .first()
    )
    if not req:
        raise ValueError(f"request_id={request_id} 에 해당하는 의뢰가 없습니다.")

    if req.platform != "youtube":
        raise ValueError("현재는 YouTube 채널만 크리에이터 분석을 지원합니다.")

    # 채널 쿼리: 일단 request.channel_name 에 '@핸들' 이 들어있다고 가정
    channel_query = req.channel_name
    if not channel_query:
        raise ValueError("Request에 channel_name 이 비어 있습니다. (@핸들 또는 채널ID 필요)")

    brand_concept = req.brand_concept or "미제공"

    # 이미 존재하는 report_creator 개수 → version 결정
    existing_count = (
        db.query(ReportCreator)
        .filter(ReportCreator.request_id == request_id)
        .count()
    )
    version = existing_count + 1

    # 파이프라인 실행
    pipeline_result = _run_creator_pipeline_core(
        channel_query=channel_query,
        brand_concept=brand_concept,
        analysis_period_months=6,
    )

    metrics = pipeline_result["metrics"]
    sections = pipeline_result["sections"]
    blc_matching_section = pipeline_result["blc_matching_section"]

    blc_score = float(metrics.get("blc_score", 0.0))
    verdict = metrics.get("verdict", "")
    tier = metrics.get("tier", "")
    components = metrics.get("blc_breakdown", {}) or {}
    raw_values = metrics.get("raw_values", {}) or {}
    comment_stats = metrics.get("comment_statistics", {}) or {}
    comment_samples = metrics.get("comment_samples", {}) or {}
    blc_matching = metrics.get("blc_matching", {}) or {}

    blc_grade, blc_grade_label = _parse_verdict(verdict)

    # meta_json 에 넣을 요약 정보
    meta_json: Dict[str, Any] = {
        "channel_name": metrics.get("channel_name"),
        "subscriber_count": metrics.get("subscriber_count"),
        "total_views": metrics.get("total_views"),
        "video_count_analyzed": metrics.get("video_count_analyzed"),
        "tier": tier,
        "verdict": verdict,
        "comment_statistics": comment_stats,
        "comment_samples": comment_samples,
        "performance_profile": metrics.get("performance_profile", {}),
        "upload_consistency": metrics.get("upload_consistency", {}),
        "format_effects": metrics.get("format_effects", {}),
        "raw_values": raw_values,
    }

    # 섹션 JSON은 단순 구조로 (필요하면 title 필드 나중에 추가)
    executive_summary_json = {
        "key": "executive_summary",
        "title": "한 장 요약",
        "content_md": sections.get("executive_summary", ""),
    }
    deep_analysis_json = {
        "key": "deep_analysis",
        "title": "심층 분석",
        "content_md": sections.get("deep_analysis", ""),
    }
    risk_mitigation_json = {
        "key": "risk_mitigation",
        "title": "리스크 & 대응",
        "content_md": sections.get("risk_mitigation", ""),
    }
    blc_matching_json = {
        "key": "blc_matching",
        "title": "BLC 매칭",
        "content_md": blc_matching_section,
        "matching": blc_matching,
    }

    # DB에 저장할 ReportCreator 인스턴스 생성
    rc = ReportCreator(
        request_id=request_id,
        latest_run_id=None,
        version=version,
        title=f"{channel_query} 크리에이터 분석 리포트",
        platform=req.platform,
        channel_url=None,          # 필요하면 나중에 채널 URL 넣기
        channel_handle=channel_query,
        channel_external_id=pipeline_result.get("channel_id"),

        blc_score=blc_score,
        blc_grade=blc_grade,
        blc_grade_label=blc_grade_label,
        blc_tier=tier,
        subscriber_count=int(
            str(metrics.get("subscriber_count", "0")).replace(",", "")
        ) if metrics.get("subscriber_count") else None,
        engagement_score=float(components.get("engagement_score", 0.0)),
        views_score=float(components.get("views_score", 0.0)),
        demand_score=float(components.get("demand_score", 0.0)),
        problem_score=float(components.get("problem_score", 0.0)),
        format_score=float(components.get("format_score", 0.0)),
        consistency_score=float(components.get("consistency_score", 0.0)),

        meta_json=meta_json,
        executive_summary_json=executive_summary_json,
        deep_analysis_json=deep_analysis_json,
        blc_matching_json=blc_matching_json,
        risk_mitigation_json=risk_mitigation_json,
    )

    db.add(rc)
    db.commit()
    db.refresh(rc)
    return rc


##----------------------------1119_근서 코드 넣기---------------------------------------------


# def run_creator_analysis_pipeline(channel_name: str) -> Dict[str, Any]:
#     """
#     실제로는 너가 Jupyter Notebook 에서 쓰던 채널 분석 코드를
#     함수로 옮겨놓은 자리.

#     지금은 구조만 맞춘 더미 구현 예시.
#     나중에 여기 안에:
#     - YouTube API / 크롤링
#     - 기존 BLC 점수 계산
#     - LLM 호출 (요약/Deep analysis 등)
#     을 넣으면 됨.
#     """
#     # TODO: 실제 로직으로 교체
#     return {
#         "latest_run_id": None,
#         "title": f"{channel_name} 크리에이터 분석 리포트",
#         "platform": "youtube",
#         "channel_url": None,
#         "channel_handle": channel_name,
#         "channel_external_id": None,
#         "blc_score": 55.3,
#         "blc_grade": "B",
#         "blc_grade_label": "조건부 Go",
#         "blc_tier": "Tier_2_Mid",
#         "subscriber_count": 123000,
#         "engagement_score": 102.4,
#         "views_score": 97.8,
#         "demand_score": 88.1,
#         "problem_score": 74.2,
#         "format_score": 90.5,
#         "consistency_score": 83.7,
#         "meta_json": {},
#         "executive_summary_json": {},
#         "deep_analysis_json": {},
#         "blc_matching_json": {},
#         "risk_mitigation_json": {},
#     }

# def build_creator_report_for_request(db: Session, request_id: int) -> ReportCreator:
#     # 1) request 가져오기
#     req = db.query(Request).filter(Request.request_id == request_id).first()
#     if not req:
#         raise HTTPException(status_code=404, detail="Request not found")

#     channel_name = req.channel_name  # 1단계: 채널명 추출

#     # --- version 계산 추가 ---
#     existing_count = (
#         db.query(ReportCreator)
#         .filter(ReportCreator.request_id == request_id)
#         .count()
#     )
#     version = existing_count + 1

#     # 2) 채널 분석 파이프라인 실행
#     analysis_result = run_creator_analysis_pipeline(channel_name)

#     rc = ReportCreator(
#         request_id=request_id,
#         latest_run_id=analysis_result.get("latest_run_id"),
#         version=version,  
#         title=analysis_result["title"],
#         platform=analysis_result["platform"],
#         channel_url=analysis_result.get("channel_url"),
#         channel_handle=analysis_result.get("channel_handle"),
#         channel_external_id=analysis_result.get("channel_external_id"),

#         blc_score=analysis_result.get("blc_score"),
#         blc_grade=analysis_result.get("blc_grade"),
#         blc_grade_label=analysis_result.get("blc_grade_label"),
#         blc_tier=analysis_result.get("blc_tier"),

#         subscriber_count=analysis_result.get("subscriber_count"),

#         engagement_score=analysis_result.get("engagement_score"),
#         views_score=analysis_result.get("views_score"),
#         demand_score=analysis_result.get("demand_score"),
#         problem_score=analysis_result.get("problem_score"),
#         format_score=analysis_result.get("format_score"),
#         consistency_score=analysis_result.get("consistency_score"),

#         meta_json=analysis_result.get("meta_json", {}),
#         executive_summary_json=analysis_result.get("executive_summary_json", {}),
#         deep_analysis_json=analysis_result.get("deep_analysis_json", {}),
#         blc_matching_json=analysis_result.get("blc_matching_json", {}),
#         risk_mitigation_json=analysis_result.get("risk_mitigation_json", {}),
#     )

#     db.add(rc)
#     db.commit()
#     db.refresh(rc)
#     return rc

# def creator_report_to_dict(rc: Optional[ReportCreator]):
#     if rc is None:
#         return None

#     return {
#         "report_creator_id": rc.report_creator_id,
#         "title": rc.title,
#         "platform": rc.platform,
#         "channel_url": rc.channel_url,
#         "channel_handle": rc.channel_handle,
#         "blc_score": float(rc.blc_score) if rc.blc_score is not None else None,
#         "blc_grade": rc.blc_grade,
#         "blc_grade_label": rc.blc_grade_label,
#         "blc_tier": rc.blc_tier,
#         "subscriber_count": rc.subscriber_count,
#         "engagement_score": float(rc.engagement_score) if rc.engagement_score is not None else None,
#         "views_score": float(rc.views_score) if rc.views_score is not None else None,
#         "demand_score": float(rc.demand_score) if rc.demand_score is not None else None,
#         "problem_score": float(rc.problem_score) if rc.problem_score is not None else None,
#         "format_score": float(rc.format_score) if rc.format_score is not None else None,
#         "consistency_score": float(rc.consistency_score) if rc.consistency_score is not None else None,
#         "meta": rc.meta_json,
#         "executive_summary": rc.executive_summary_json,
#         "deep_analysis": rc.deep_analysis_json,
#         "blc_matching": rc.blc_matching_json,
#         "risk_mitigation": rc.risk_mitigation_json,
#         "created_at": rc.created_at,
#     }

