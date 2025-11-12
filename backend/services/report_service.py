import re, json, datetime
from collections import Counter
from typing import Any, Dict, List
import pandas as pd
from ..core.llm import llm_section

def _tier(s: float) -> str:
    s = float(s)
    return "S" if s >= 0.85 else "A" if s >= 0.75 else "B" if s >= 0.60 else "C"

def md_table_from_rows(rows: List[List[Any]]) -> str:
    if not rows or not rows[0]:
        return ""
    head = "| " + " | ".join(map(str, rows[0])) + " |\n"
    sep  = "| " + " | ".join(["---"]*len(rows[0])) + " |\n"
    body = "".join("| " + " | ".join(map(str, r)) + " |\n" for r in rows[1:])
    return head + sep + body

def crop(s: str, n: int) -> str:
    s = s or ""
    return s if len(s) <= n else s[:n]

def make_digest(df: pd.DataFrame, topn=15) -> dict:
    d: Dict[str, Any] = {}
    s = df["score"].astype(float)
    if len(s):
        d["score_stats"] = {
            "min": float(s.min()), "p10": float(s.quantile(0.10)),
            "p25": float(s.quantile(0.25)), "p50": float(s.quantile(0.50)),
            "p75": float(s.quantile(0.75)), "p90": float(s.quantile(0.90)),
            "max": float(s.max()), "mean": float(s.mean()),
            "std": float(s.std(ddof=0)), "rows": int(len(s)),
        }
    else:
        d["score_stats"] = {"rows": 0}
    d["tier_counts"] = {
        "S": int((df["score"]>=0.85).sum()),
        "A": int(((df["score"]>=0.75)&(df["score"]<0.85)).sum()),
        "B": int(((df["score"]>=0.60)&(df["score"]<0.75)).sum()),
        "C": int((df["score"]<0.60).sum()),
    }
    c = Counter()
    for s_ in df["key_ings"].fillna(""):
        for t in re.split(r"[,\|/;]", str(s_)):
            t = t.strip()
            if t:
                c[t]+=1
    d["top_key_ings"] = [{"token":k,"cnt":v} for k,v in c.most_common(topn)]

    cols = [c for c in ["product_id","product_name","score","key_ings","summary3"] if c in df.columns]
    top = (df.sort_values("score", ascending=False).head(max(10, topn))[cols]).fillna("")
    rows = [["product_id","name","score","tier","key_ings","insight"]]
    for _, r in top.iterrows():
        rows.append([
            str(r.get("product_id","")),
            str(r.get("product_name","")),
            f'{float(r.get("score",0.0)):.3f}',
            _tier(r.get("score",0.0)),
            str(r.get("key_ings","")),
            (str(r.get("summary3",""))[:160] + "…") if len(str(r.get("summary3",""))) > 160 else str(r.get("summary3","")),
        ])
    d["top_products_table"] = rows
    d["top_products_table_md"] = md_table_from_rows(rows)
    return d

def make_prompts(digest_brief: str, top_table_md: str,
                 influencer: str, category: str, concept: str, channel_url: str):
    # (기존 프롬프트 내용 그대로 이동)
    # --- 생략: 질문에 주신 p1~p10, pA 그대로 옮기세요 ---
    # 여기서는 간결화:
    return [
        ("1) 브랜드 요약", f"...{digest_brief}\n{top_table_md}"),
        # 나머지 섹션들...
    ]

def build_report_from_df(df: pd.DataFrame, influencer: str, category: str, concept: str,
                         channel_url: str, topn_ings: int):
    for c in ["product_id","product_name","key_ings","summary3"]:
        if c not in df.columns:
            df[c] = ""
        df[c] = df[c].astype(str)
    if "score" not in df.columns:
        raise ValueError("CSV에 score 컬럼이 없습니다. (필수)")
    df["score"] = pd.to_numeric(df["score"], errors="coerce").fillna(0.0)

    digest = make_digest(df, topn=topn_ings)
    digest_brief = json.dumps({
        "score_stats": digest.get("score_stats", {}),
        "tier_counts": digest.get("tier_counts", {}),
        "top_key_ings": (digest.get("top_key_ings", [])[:12]),
    }, ensure_ascii=False, indent=2)
    digest_brief = crop(digest_brief, 3000)
    top_table_md = crop(digest.get("top_products_table_md", ""), 2500)

    prompts = make_prompts(digest_brief, top_table_md, influencer, category, concept, channel_url)
    sections_md = [{"title": label, "format": "md", "content": llm_section(pr)} for label, pr in prompts]

    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    return {
        "meta": {
            "influencer": influencer, "category": category, "concept": concept,
            "channel_url": channel_url, "created_at": ts
        },
        "digest": {
            "score_stats": digest.get("score_stats", {}),
            "tier_counts": digest.get("tier_counts", {}),
            "top_key_ings": digest.get("top_key_ings", [])[:12],
            "top_products_table_md": top_table_md
        },
        "sections": sections_md
    }
