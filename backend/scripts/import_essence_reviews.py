# scripts/import_essence_review.py

import os
import sys

# backend 디렉터리를 sys.path 에 추가
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pandas as pd
from sqlalchemy.orm import Session

from core.db import SessionLocal
from models.oliveyoung_review import OliveyoungReview

# ============================================
# ✅ 1122 파일 경로 (본인 PC 경로에 맞게 수정)
# ============================================
BASE_CSV_PATH = r"C:\Users\rumbl\OneDrive\바탕 화면\인공지능사관학교\기업 프로젝트\설계\beautiq\backend\scripts\1122_essence_serum_ampoule.csv"

CHUNK_SIZE = 2000


def load_in_chunks(csv_path: str, chunk_size: int):
    """CSV를 chunk 단위로 읽는 제너레이터"""
    return pd.read_csv(csv_path, chunksize=chunk_size)


def clean_record(rec: dict, default_category: str = "essence_serum_ampoule") -> dict:
    """
    DB에 넣기 전에 한 레코드를 정리하는 헬퍼.
    - id, analyzed_at 은 CSV에 있어도 무시 (DB default 사용)
    - score, review_cnt, share_pos 타입 보정
    - category_code, summary3, source 기본값 세팅
    """
    rec = dict(rec)

    # PK, timestamp 는 DB에 맡김
    rec.pop("id", None)
    rec.pop("analyzed_at", None)

    # 숫자형 컬럼 보정
    if "score" in rec:
        try:
            rec["score"] = float(rec["score"])
        except Exception:
            rec["score"] = 0.0
    else:
        rec["score"] = 0.0

    if "review_cnt" in rec:
        try:
            rec["review_cnt"] = int(rec["review_cnt"])
        except Exception:
            rec["review_cnt"] = 0
    else:
        rec["review_cnt"] = 0

    if "share_pos" in rec:
        try:
            rec["share_pos"] = float(rec["share_pos"])
        except Exception:
            rec["share_pos"] = 0.0
    else:
        rec["share_pos"] = 0.0

    # 카테고리 기본값 (테이블 CHECK 제약 만족)
    if "category_code" not in rec or pd.isna(rec.get("category_code")) or str(rec.get("category_code")).strip() == "":
        rec["category_code"] = default_category
    else:
        rec["category_code"] = str(rec["category_code"]).strip()

    # summary3 기본값 (NOT NULL)
    if "summary3" not in rec or pd.isna(rec.get("summary3")):
        rec["summary3"] = ""
    else:
        rec["summary3"] = str(rec["summary3"])

    # source 기본값: ENUM(review_source_enum) 을 고려해 'oliveyoung'으로 통일
    raw_source = rec.get("source", None)
    if raw_source is None or (isinstance(raw_source, float) and pd.isna(raw_source)) or str(raw_source).strip() == "":
        rec["source"] = "oliveyoung"
    else:
        rec["source"] = str(raw_source).strip()

    # 문자열 컬럼 NaN → ""
    for key in ["product_id", "product_name", "key_ings"]:
        if key in rec:
            if pd.isna(rec[key]):
                rec[key] = ""
            else:
                rec[key] = str(rec[key])

    return rec


def import_csv_to_db(
    base_csv_path: str = BASE_CSV_PATH,
    default_category: str = "essence_serum_ampoule",
    chunk_size: int = CHUNK_SIZE,
):
    """
    1122_essence_serum_ampoule.csv 를 oliveyoung_review 테이블에 적재하는 함수.
    """
    if not os.path.exists(base_csv_path):
        print(f"[ERROR] base CSV 파일을 찾을 수 없습니다: {base_csv_path}")
        sys.exit(1)

    session: Session = SessionLocal()
    total_inserted = 0

    try:
        print(f"[INFO] base CSV 로딩 시작: {base_csv_path}")
        for i, chunk in enumerate(load_in_chunks(base_csv_path, chunk_size)):

            if "product_id" not in chunk.columns:
                raise ValueError("CSV에 'product_id' 컬럼이 없습니다.")

            # product_id 문자열화
            chunk["product_id"] = chunk["product_id"].astype(str)

            # 없는 숫자 컬럼 대비: 기본값 컬럼 생성
            if "review_cnt" not in chunk.columns:
                chunk["review_cnt"] = 0
            if "share_pos" not in chunk.columns:
                chunk["share_pos"] = 0.0
            if "score" not in chunk.columns:
                chunk["score"] = 0.0

            records = chunk.to_dict(orient="records")
            cleaned = [clean_record(r, default_category=default_category) for r in records]

            # ⚠ UNIQUE (source, product_id) 제약 때문에
            # 이미 같은 product_id가 들어간 상태에서 또 실행하면 에러가 날 수 있음.
            # 한 번만 적재용으로 사용하거나, 필요 시 ON CONFLICT 로직을 별도로 구현.
            session.bulk_insert_mappings(OliveyoungReview, cleaned)
            session.commit()

            total_inserted += len(cleaned)
            print(f"[INFO] chunk {i+1}: {len(cleaned)} rows inserted (누적 {total_inserted})")

        print(f"[DONE] 전체 {total_inserted} 건 적재 완료")

    except Exception as e:
        session.rollback()
        print(f"[ERROR] 적재 중 오류 발생: {e}")
        raise

    finally:
        session.close()


if __name__ == "__main__":
    """
    사용법:
      📌 기본 (1122_essence_serum_ampoule.csv 사용)
        python scripts/import_essence_review.py

      📌 다른 CSV 경로로 실행하고 싶다면:
        python scripts/import_essence_review.py path/to/other.csv
    """
    if len(sys.argv) == 1:
        base_path = BASE_CSV_PATH
    elif len(sys.argv) == 2:
        base_path = sys.argv[1]
    else:
        print("Usage: python scripts/import_essence_review.py [csv_path]")
        sys.exit(1)

    import_csv_to_db(base_csv_path=base_path, default_category="essence_serum_ampoule")
