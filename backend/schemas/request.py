from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr, constr

ShortStr = constr(min_length=1, max_length=200)
LongStr  = constr(min_length=1, max_length=5000)

currentStatus = Literal["idle", "ready"] ## 벡엔드에서는 두가지만 관리하자

class RequestCreate(BaseModel):
    activity_name: ShortStr
    platform: Literal['youtube','instagram','tiktok','x','etc']
    channel_name: ShortStr
    category_code: Literal['skin_toner','essence_serum_ampoule','lotion','cream','mist_oil']
    brand_concept: LongStr
    contact_method: constr(min_length=1, max_length=120)
    email: EmailStr
    view_pw: constr(min_length=4, max_length=128)

class RequestCreateResp(BaseModel):
    request_id: int
    message: str

class RequestAdminItem(BaseModel):
    request_id: int
    activity_name: str
    platform: str
    channel_name: str
    category_code: str
    brand_concept: str
    contact_method: str
    email: EmailStr

    # 새로 추가되는 필드들
    status: currentStatus             # <- 여기서 status 추가
    report_id: Optional[int] = None
    is_exported: bool = False

    class Config:
        orm_mode = True

class RequestAdminListResp(BaseModel):
    items: list[RequestAdminItem]