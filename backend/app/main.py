from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, report, request
from core.config import ALLOWED_ORIGINS

app = FastAPI()

# 프론트/로컬 주소들
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://beautiq-1-sgzp.onrender.com",  # 실제 프론트 도메인
]

app.add_middleware(
    CORSMiddleware,
    allow_origins= origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(report.router)
app.include_router(request.router)

# 3) 헬스체크
@app.get("/healthz")
def healthz():
    return {"status": "ok"}

