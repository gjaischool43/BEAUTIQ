import json
import re
from typing import List
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent
JSON_PATH = BASE_DIR / "category_keyword_tag.json"

def load_category_keyword_tag():
    with JSON_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)
    
DEFAULT_FOCUS = ["진정", "보습"]

# 1) JSON 로드
with open("category_keyword_tag.json", "r", encoding="utf-8") as f:
    CATEGORY_KEYWORD_TAG = json.load(f)


def infer_focus_tags(category_code: str, top_tokens: List[str]) -> List[str]:
    """
    - category_keyword_tag.json 에서 해당 category_code에 맞는 룰만 필터링
    - top_tokens를 하나의 문자열로 합쳐서 regex 검색
    - 매칭된 focus_tag를 set에 모아서 반환
    - 아무것도 안 걸리면 DEFAULT_FOCUS 보장
    """
    text = " ".join(top_tokens)
    tags: set[str] = set()

    for rule in CATEGORY_KEYWORD_TAG:
        if rule["category_code"] != category_code:
            continue

        pattern = rule["ingredient_keyword"]
        if re.search(pattern, text, flags=re.IGNORECASE):
            tags.add(rule["focus_tag"])

    if not tags:
        tags.update(DEFAULT_FOCUS)

    return sorted(tags)


def infer_product_type(request_cat: str, focus_tags: List[str]) -> str:
    """
    request_cat: '세럼', '토너', '로션', '크림' 등 자연어 or category_code 일부 문자열
    focus_tags: infer_focus_tags 결과
    """
    # 베이스 제품 타입
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

    # 효능 축에 따른 프리픽스
    if "진정" in focus_tags and ("보습/장벽" in focus_tags or "보습/수분" in focus_tags):
        prefix = "저자극 진정·보습"
    elif any(t.startswith("미백/톤") or t.startswith("미백/톤업") for t in focus_tags):
        prefix = "톤 보정·광채"
    elif "탄력/주름" in focus_tags:
        prefix = "탄력 집중"
    else:
        prefix = "데일리"

    return f"{prefix} {base}"
