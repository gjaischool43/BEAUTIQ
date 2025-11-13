from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, report, request
from core.config import ALLOWED_ORIGINS

app = FastAPI(title="BM Report API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(report.router)
app.include_router(request.router)

