import pandas as pd
import re
from typing import List

DEFAULT_FOCUS = ["진정", "보습"]

SKINCARE_ING_DB = pd.DataFrame([
    # 스킨/토너
    {"category_code": "skin_toner", "ingredient_keyword": r"센텔라|시카|병풀|마데카", "focus_tag": "진정"},
    {"category_code": "skin_toner", "ingredient_keyword": r"히알루론산|판테놀|글리세린|세라마이드", "focus_tag": "보습/장벽"},
    {"category_code": "skin_toner", "ingredient_keyword": r"나이아신아마이드|비타민\s*C", "focus_tag": "미백/톤"},

    # 세럼/앰플
    {"category_code": "essence_serum_ampoule", "ingredient_keyword": r"센텔라|시카|TECA", "focus_tag": "진정"},
    {"category_code": "essence_serum_ampoule", "ingredient_keyword": r"레티놀|펩타이드", "focus_tag": "탄력/주름"},
    # ... 카테고리별로 계속 추가
])

def infer_focus_tags(category_code: str, top_tokens: List[str]) -> List[str]:
    ing_str = " ".join(top_tokens)
    tags = set()

    # 1) 공통 성분 기반 태그 (지금 이미 쓰고 있는 규칙)
    if re.search(r"센텔라|시카|마데카|병풀", ing_str):
        tags.add("진정")
    if re.search(r"판테놀|히알루론산|글리세린|세라마이드", ing_str):
        tags.add("보습/장벽")
    if re.search(r"나이아신아마이드|비타민\s*C", ing_str):
        tags.add("미백/톤")

    # 2) 카테고리별 하드코딩 DB 참조
    sub = SKINCARE_ING_DB[SKINCARE_ING_DB["category_code"] == category_code]
    for _, row in sub.iterrows():
        if re.search(row["ingredient_keyword"], ing_str):
            tags.add(row["focus_tag"])

    # 3) 최소 보장
    if not tags:
        tags.update(DEFAULT_FOCUS)

    return list(tags)

def infer_product_type(request_cat: str, focus_tags: List[str]) -> str:
    # request_cat은 '세럼', '토너', '로션' 같은 자연어 or category_code
    if "세럼" in request_cat or "ampoule" in request_cat or "essence" in request_cat:
        base = "세럼"
    elif "토너" in request_cat or "스킨" in request_cat:
        base = "토너"
    elif "로션" in request_cat:
        base = "로션"
    elif "크림" in request_cat:
        base = "크림"
    else:
        base = "루틴 세트"

    # 효능 축에 따라 앞에 수식 붙이기
    if "진정" in focus_tags and "보습/장벽" in focus_tags:
        prefix = "저자극 진정·보습"
    elif "미백/톤" in focus_tags:
        prefix = "톤 보정·광채"
    else:
        prefix = "데일리"

    return f"{prefix} {base}"
