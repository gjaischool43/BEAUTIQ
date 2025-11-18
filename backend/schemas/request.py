from typing import Literal, Optional, List
from pydantic import BaseModel, EmailStr, constr

ShortStr = constr(min_length=1, max_length=200)
LongStr  = constr(min_length=1, max_length=5000)

currentStatus = Literal["idle", "ready"] ## 벡엔드에서는 두가지만 관리하자

Platform = Literal["youtube", "instagram", "tiktok", "x", "etc"]
CategoryCode = Literal[
    "skin_toner",
    "essence_serum_ampoule",
    "lotion",
    "cream",
    "mist_oil",
]

# class RequestCreate(BaseModel):
#     activity_name: ShortStr
#     platform: Literal['youtube','instagram','tiktok','x','etc']
#     channel_name: ShortStr
#     category_code: CategoryCode = Field(alias="productCategory")
#     contact_method: constr(min_length=1, max_length=120)
#     email: EmailStr
#     view_pw: constr(min_length=4, max_length=128)

class RequestCreateReq(BaseModel):
    # 프론트에서 보내는 키 이름에 맞춰 alias 지정
    activity_name: str = Field(alias="activityName")
    platform: Platform
    channel_name: str = Field(alias="channelName")
    category_code: CategoryCode = Field(alias="productCategory")
    brand_concept: str = Field(alias="brandConcept")
    contact_method: str = Field(alias="contact")
    email: EmailStr
    view_pw: str = Field(alias="viewPassword")

    class Config:
        populate_by_name = True  # 나중에 서버 내부에서 activity_name 이름으로도 생성 가능

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