import json
import re
from pathlib import Path
from typing import Any

KB_PATH = Path(__file__).resolve().parents[1] / "knowledge" / "safety.json"

def _load() -> list[dict[str, Any]]:
    return json.loads(KB_PATH.read_text(encoding="utf-8"))

def _tokens(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z\u0900-\u0d7f]+", text.lower()))

def retrieve_safety(query: str, weather: dict, language: str, k: int = 3) -> list[dict]:
    docs = _load()
    q = _tokens(query + " " + str(weather.get("condition", "")))
    scored = []
    for doc in docs:
        hay = " ".join([doc.get("hazard",""), doc.get("title",""), doc.get("text",""), " ".join(doc.get("keywords",[]))])
        score = len(q & _tokens(hay))
        if score:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [d for _, d in scored[:k]]

def build_context(query: str, weather: dict, language: str) -> dict:
    docs = retrieve_safety(query, weather, language)
    return {
        "documents": docs,
        "sources": sorted({d["source_url"] for d in docs}),
        "retrieval": "keyword-RAG",
    }
