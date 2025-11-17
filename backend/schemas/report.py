from typing import List, Literal, Dict, Any
from pydantic import BaseModel

class CSVRecords(BaseModel):
    type: Literal["records"] = "records"
    columns: List[str]
    rows: List[List[object]]

class BuildReportInput(BaseModel):
    influencer: str
    category: str
    concept: str
    channel_url: str
    topn_ings: int = 15
    csv: CSVRecords

class Section(BaseModel):
    title: str
    format: str = "md"
    content: str

class BuildReportOutput(BaseModel):
    meta: Dict[str, Any]
    digest: Dict[str, Any]
    sections: List[Section]

class ReportBMDetail(BaseModel):
    report_id: int
    request_id: int
    title: str | None = None
    contents: Dict[str, Any]
    is_exported: bool

    class Config:
        orm_mode = True

class ReportExportResp(BaseModel):
    report_id: int
    is_exported: bool