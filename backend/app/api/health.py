from fastapi import APIRouter

router = APIRouter()

@router.get("/healthz")
def healthz():
    return {"ok": True}

@router.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI on Render!"}
