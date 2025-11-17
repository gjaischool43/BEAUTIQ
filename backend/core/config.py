import os

# 필수
DATABASE_URL = os.getenv("DATABASE_URL")  
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# LLM 설정
PRIMARY_MODEL   = os.getenv("PRIMARY_MODEL", "gpt-5-mini")
FALLBACK_MODEL_1 = os.getenv("FALLBACK_MODEL_1", "gpt-4o-mini")
FALLBACK_MODELS = [PRIMARY_MODEL, FALLBACK_MODEL_1]
MAX_TOK_SECTION = int(os.getenv("MAX_TOK_SECTION", "1500"))
MIN_ACCEPT_CHARS= int(os.getenv("MIN_ACCEPT_CHARS", "250"))

# CORS - 초기엔 * 허용, 운영 시 프런트 도메인만
ALLOWED_ORIGINS = [
    os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
]
