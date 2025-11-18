from pydantic import BaseModel

class AdminReportDetailResp(BaseModel):
    report_id: int
    request_id: int
    title: str
    html: str
    is_exported: bool