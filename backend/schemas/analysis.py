from typing import Optional
from pydantic import BaseModel
from typing import Literal

class AnalysisStartResp(BaseModel):
    request_id: int
    status: Literal["ready", "idle", "processing"]
    report_id: Optional[int] = None
    creator_report_id: Optional[int] = None
    message: str