from typing import Literal
from pydantic import BaseModel, EmailStr, constr

ShortStr = constr(min_length=1, max_length=200)
LongStr  = constr(min_length=1, max_length=5000)

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
