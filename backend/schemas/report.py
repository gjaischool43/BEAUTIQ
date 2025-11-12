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
