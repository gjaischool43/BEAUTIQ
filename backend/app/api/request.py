from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from schemas.request import RequestCreate, RequestCreateResp
from core.db import get_db
from services.request_service import create_request

router = APIRouter()

@router.post("/request", response_model=RequestCreateResp)
def create_request_api(payload: RequestCreate, db: Session = Depends(get_db)):
    try:
        new_id = create_request(db, payload=payload)
        return RequestCreateResp(request_id=new_id, message="의뢰가 접수되었습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {e}")
