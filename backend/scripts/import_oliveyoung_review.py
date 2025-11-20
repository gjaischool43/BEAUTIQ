# scripts/import_oliveyoung_review.py

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

# 기본 CSV 경로 (필요시 수정)
BASE_CSV_PATH = r"C:\Users\rumbl\OneDrive\바탕 화면\인공지능사관학교\기업 프로젝트\설계\beautiq\backend\scripts\1117_skin_toner.csv"
STATS_CSV_PATH = r"C:\Users\rumbl\OneDrive\바탕 화면\인공지능사관학교\기업 프로젝트\설계\beautiq\backend\scripts\product_reviews_ingredients.csv"

CHUNK_SIZE = 2000


def load_base_in_chunks(csv_path: str, chunk_size: int):
    """1117_skin_toner.csv 를 chunk 단위로 읽는 제너레이터"""
    return pd.read_csv(csv_path, chunksize=chunk_size)


def load_stats(csv_path: str) -> pd.DataFrame:
    """
    product_reviews_ingredients.csv 를 읽어서
    product_id, review_cnt, share_pos 만 남긴 DataFrame 반환
    """
    if not os.path.exists(csv_path):
        print(f"[ERROR] stats CSV 파일을 찾을 수 없습니다: {csv_path}")
        sys.exit(1)

    df = pd.read_csv(csv_path)

    needed_cols = {"product_id", "review_cnt", "share_pos"}
    missing = needed_cols - set(df.columns)
    if missing:
        raise ValueError(
            f"stats CSV에 필요한 컬럼이 없습니다: {missing}. "
            f"현재 컬럼: {list(df.columns)}"
        )

    # 필요한 컬럼만 사용
    df = df[list(needed_cols)].copy()

    # product_id 기준으로 중복 제거 (있다면)
    df = df.drop_duplicates(subset=["product_id"])

    # 타입 정리
    df["product_id"] = df["product_id"].astype(str)
    df["review_cnt"] = pd.to_numeric(df["review_cnt"], errors="coerce").fillna(0).astype("int64")
    df["share_pos"] = pd.to_numeric(df["share_pos"], errors="coerce").fillna(0.0).astype(float)

    return df


def clean_record(rec: dict) -> dict:
    """
    DB에 넣기 전에 한 레코드를 정리하는 헬퍼.
    - id, analyzed_at 은 CSV에 있어도 무시 (DB default 사용)
    - score, review_cnt, share_pos 타입 보정
    """
    rec = dict(rec)

    # PK와 자동 timestamp는 DB에 맡기기
    rec.pop("id", None)
    rec.pop("analyzed_at", None)

    # 필수 숫자형 컬럼 보정
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

    # 문자열 컬럼 NaN → "" 처리
    for key in ["product_id", "product_name", "key_ings", "summary3", "category_code", "source"]:
        if key in rec and pd.isna(rec[key]):
            rec[key] = ""

    return rec


def import_csv_to_db(
    base_csv_path: str = BASE_CSV_PATH,
    stats_csv_path: str = STATS_CSV_PATH,
    chunk_size: int = CHUNK_SIZE,
):
    if not os.path.exists(base_csv_path):
        print(f"[ERROR] base CSV 파일(1117_skin_toner)을 찾을 수 없습니다: {base_csv_path}")
        sys.exit(1)

    # 1) stats CSV 로드 (product_id → review_cnt, share_pos)
    print(f"[INFO] stats CSV 로딩: {stats_csv_path}")
    stats_df = load_stats(stats_csv_path)

    # product_id 기준 join 용도로 index 준비
    stats_df = stats_df.set_index("product_id")

    session: Session = SessionLocal()
    total_inserted = 0
    missing_stats_total = 0

    try:
        print(f"[INFO] base CSV 로딩 시작: {base_csv_path}")
        for i, chunk in enumerate(load_base_in_chunks(base_csv_path, chunk_size)):
            # product_id 문자열화
            if "product_id" not in chunk.columns:
                raise ValueError("base CSV에 'product_id' 컬럼이 없습니다.")
            chunk["product_id"] = chunk["product_id"].astype(str)

            # 2) product_id 기준으로 stats 붙이기
            #   - left join: base 기준
            chunk = chunk.merge(
                stats_df.reset_index(),
                on="product_id",
                how="left",
                suffixes=("", "_stats"),
            )

            # 3) review_cnt / share_pos 없는 경우 0으로 대체
            missing_mask = chunk["review_cnt"].isna() | chunk["share_pos"].isna()
            missing_count = int(missing_mask.sum())
            if missing_count > 0:
                missing_stats_total += missing_count
                print(
                    f"[WARN] chunk {i+1}: review_cnt/share_pos 매칭 안 된 행 {missing_count}건 → 0으로 채움"
                )

            chunk["review_cnt"] = (
                pd.to_numeric(chunk["review_cnt"], errors="coerce").fillna(0).astype("int64")
            )
            chunk["share_pos"] = (
                pd.to_numeric(chunk["share_pos"], errors="coerce").fillna(0.0).astype(float)
            )

            # 4) dict 리스트로 변환 후 clean_record 적용
            records = chunk.to_dict(orient="records")
            cleaned = [clean_record(r) for r in records]

            # 5) DB 적재
            session.bulk_insert_mappings(OliveyoungReview, cleaned)
            session.commit()

            total_inserted += len(cleaned)
            print(f"[INFO] chunk {i+1}: {len(cleaned)} rows inserted (누적 {total_inserted})")

        print(f"[DONE] 전체 {total_inserted} 건 적재 완료")
        if missing_stats_total > 0:
            print(
                f"[WARN] review_cnt/share_pos 매칭 실패 총 {missing_stats_total}건 "
                f"(해당 행은 review_cnt=0, share_pos=0.0 으로 저장됨)"
            )
    except Exception as e:
        session.rollback()
        print(f"[ERROR] 적재 중 오류 발생: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    """
    사용법:
      python import_oliveyoung_review.py
        → 기본 경로(BASE_CSV_PATH, STATS_CSV_PATH) 사용

      python import_oliveyoung_review.py base.csv stats.csv
        → base.csv, stats.csv 경로를 직접 지정
    """
    if len(sys.argv) == 1:
        base_path = BASE_CSV_PATH
        stats_path = STATS_CSV_PATH
    elif len(sys.argv) == 3:
        base_path = sys.argv[1]
        stats_path = sys.argv[2]
    else:
        print("Usage: python import_oliveyoung_review.py [base_csv stats_csv]")
        sys.exit(1)

    import_csv_to_db(base_csv_path=base_path, stats_csv_path=stats_path)
