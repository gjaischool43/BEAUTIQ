## 의뢰 조회 관련된 API

# app/schemas/request_lookup.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class RequestLookupReq(BaseModel):
    email: EmailStr
    view_pw: str

class RequestLookupReport(BaseModel):
    report_id: int
    request_id: int
    title: str | None = None
    html: str

class RequestLookupResp(BaseModel):
    available: bool
    message: str
    report: Optional[RequestLookupReport] = None
