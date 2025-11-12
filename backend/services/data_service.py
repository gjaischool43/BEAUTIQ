import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

def fetch_reviews_df(db: Session, *, category_code: str, source: str, min_analyzed_at: str|None, limit: int) -> pd.DataFrame:
    # 실 DB 스키마에 맞게 SELECT 작성
    # 예시: oliveyoung_review 테이블 가정
    q = """
    SELECT product_id, product_name, score, key_ings, summary3
    FROM oliveyoung_review
    WHERE category_code = :category_code
      AND source = :source
      {date_clause}
    ORDER BY analyzed_at DESC
    LIMIT :limit
    """
    date_clause = ""
    params = {"category_code": category_code, "source": source, "limit": limit}
    if min_analyzed_at:
        date_clause = "AND analyzed_at >= :min_analyzed_at"
        params["min_analyzed_at"] = min_analyzed_at
    sql = text(q.format(date_clause=date_clause))
    rows = db.execute(sql, params).mappings().all()
    return pd.DataFrame(rows)
