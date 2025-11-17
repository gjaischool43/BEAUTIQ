# scripts/import_oliveyoung_review.py

import os
import sys
import math

# backend 디렉터리를 sys.path 에 추가
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import pandas as pd
from sqlalchemy.orm import Session

# 프로젝트 구조에 맞게 경로/모듈 수정
from core.db import SessionLocal  # SessionLocal: sessionmaker 엔진 연결된 것
from models.oliveyoung_review import OliveyoungReview



CSV_PATH = r"C:\Users\rumbl\OneDrive\바탕 화면\인공지능사관학교\기업 프로젝트\설계\beautiq\backend\scripts\1117_skin_toner.csv"  # 실제 CSV 경로로 바꿔줘
CHUNK_SIZE = 2000                        # 너무 크면 메모리 부담 → 적당히 조절


def load_csv_in_chunks(csv_path: str, chunk_size: int):
    """
    pandas 의 chunksize 를 이용해서 CSV 를 조금씩 읽는 제너레이터
    """
    return pd.read_csv(csv_path, chunksize=chunk_size)


def clean_record(rec: dict) -> dict:
    """
    DB에 넣기 전에 한 레코드를 정리하는 헬퍼.
    - id, analyzed_at 은 CSV에 있어도 무시 (DB default 사용)
    - score 는 float/decimal 로 변환 보정
    """
    rec = dict(rec)  # 원본 보호

    # PK와 자동 timestamp는 DB에 맡기기
    rec.pop("id", None)
    rec.pop("analyzed_at", None)

    # score 가 문자열일 수도 있으니 float로 한 번 맞춰둠
    if "score" in rec and pd.notna(rec["score"]):
        try:
            rec["score"] = float(rec["score"])
        except Exception:
            rec["score"] = 0.0

    # 공백/NaN 문자열 처리
    for key in ["product_name", "key_ings", "summary3", "category_code", "source"]:
        if key in rec and pd.isna(rec[key]):
            rec[key] = ""

    return rec


def import_csv_to_db(csv_path: str = CSV_PATH, chunk_size: int = CHUNK_SIZE):
    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV 파일을 찾을 수 없습니다: {csv_path}")
        sys.exit(1)

    session: Session = SessionLocal()
    total_inserted = 0

    try:
        print(f"[INFO] CSV 로딩 시작: {csv_path}")
        for i, chunk in enumerate(load_csv_in_chunks(csv_path, chunk_size)):
            records = chunk.to_dict(orient="records")
            cleaned = [clean_record(r) for r in records]

            # bulk_insert_mappings 가끔 unique conflict 시 에러 발생 → 초기에 비어있으면 문제 없음
            # 만약 중복 있을 수 있으면 ON CONFLICT 전략(psycopg2 등)으로 가거나,
            # 여기서 개별 upsert 로직을 구현해야 함.
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
    csv_path = CSV_PATH
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    import_csv_to_db(csv_path=csv_path)
