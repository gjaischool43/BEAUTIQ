from sqlalchemy.orm import Session
from sqlalchemy import text
from core.security import hash_password

def create_request(db: Session, *, payload) -> int:
    pw_hash = hash_password(payload.view_pw)
    # PostgreSQL: LAST_INSERT_ID() 없음 → RETURNING 사용
    sql = text("""
        INSERT INTO request (
            user_id, activity_name, platform, channel_name, category_code,
            brand_concept, contact_method, email, view_pw_hash
        ) VALUES (
            :user_id, :activity_name, :platform, :channel_name, :category_code,
            :brand_concept, :contact_method, :email, :view_pw_hash
        )
        RETURNING request_id
    """)
    params = {
        "user_id": 1,
        "activity_name": payload.activity_name,
        "platform": payload.platform,
        "channel_name": payload.channel_name,
        "category_code": payload.category_code,
        "brand_concept": payload.brand_concept,
        "contact_method": payload.contact_method,
        "email": payload.email,
        "view_pw_hash": pw_hash,
    }
    new_id = db.execute(sql, params).scalar_one()
    db.commit()
    return int(new_id)
