import logging
from openai import OpenAI
from .config import OPENAI_API_KEY, FALLBACK_MODELS, MAX_TOK_SECTION, MIN_ACCEPT_CHARS

_client = None
def get_openai_client() -> OpenAI:
    global _client
    if _client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client

def llm_section(prompt: str, max_tok=MAX_TOK_SECTION, tries=3) -> str:
    base = prompt.strip()
    for m in FALLBACK_MODELS:
        p = base
        mtok = max_tok
        for i in range(tries):
            try:
                client = get_openai_client()
                resp = client.chat.completions.create(
                    model=m,
                    messages=[
                        {"role":"system","content":"너는 한국어 BM 리포트 전문가다. 반드시 마크다운 텍스트만 출력한다."},
                        {"role":"user","content":p}
                    ],
                    max_completion_tokens=mtok,
                )
                txt = (resp.choices[0].message.content or "").strip()
                if len(txt) >= MIN_ACCEPT_CHARS:
                    return txt
            except Exception as e:
                logging.warning(f"[LLM WARN] model={m} try={i+1}: {e}")
            p = "아래 지시를 요약형으로, 표/리스트 중심으로, 군더더기 없이 작성하라.\n\n" + base[:3500]
            mtok = max(900, int(mtok * 0.8))
    return "> [LLM 응답 부족으로 섹션 생성을 건너뜀]"
