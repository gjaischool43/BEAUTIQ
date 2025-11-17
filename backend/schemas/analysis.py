from pydantic import BaseModel
from typing import Literal

class AnalysisStartResp(BaseModel):
    request_id: int
    status: Literal["preparing", "ready"]
    message: str