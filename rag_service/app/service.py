import os
import uuid
from typing import List, Dict, Any
from pypdf import PdfReader
from qdrant_client.http import models as qm

from app.schemas import IngestRequest, QueryRequest
from app import qdrant_store
from app.llm import embed, chat

# Simple chunker (replace with RecursiveCharacterTextSplitter if you want)
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
    if not text:
        return []
    chunks = []
    i = 0
    n = len(text)
    while i < n:
        j = min(i + chunk_size, n)
        chunks.append(text[i:j])
        i = max(j - overlap, j)
    return chunks

def read_pdf(file_path: str) -> List[Dict[str, Any]]:
    reader = PdfReader(file_path)
    pages = []
    for idx, page in enumerate(reader.pages):
        txt = page.extract_text() or ""
        pages.append({"page": idx + 1, "text": txt})
    return pages

def ingest_pdf(req: IngestRequest) -> Dict[str, Any]:
    if not os.path.exists(req.file_path):
        raise FileNotFoundError(req.file_path)

    pages = read_pdf(req.file_path)

    # Prepare chunks
    payloads = []
    texts = []
    for p in pages:
        for chunk in chunk_text(p["text"]):
            if chunk.strip():
                texts.append(chunk)
                payloads.append({
                    "user_id": req.user_id,
                    "project_id": req.project_id,
                    "document_id": req.document_id,
                    "file": req.original_name,
                    "page": p["page"],
                    "text": chunk
                })

    if not texts:
        return {"status": "failed", "reason": "No extractable text from PDF"}

    vectors = embed(texts)
    dim = len(vectors[0])
    qdrant_store.ensure_collection(dim)

    points = []
    for vec, payload in zip(vectors, payloads):
        pid = str(uuid.uuid4())
        points.append(qm.PointStruct(id=pid, vector=vec, payload=payload))

    qdrant_store.upsert(points)

    return {
        "status": "ingested",
        "chunks": len(points),
        "document_id": req.document_id
    }

def query_rag(req: QueryRequest) -> Dict[str, Any]:
    # Embed query
    qvec = embed([req.message])[0]

    hits = qdrant_store.search(
        query_vector=qvec,
        user_id=req.user_id,
        project_id=req.project_id,
        document_id=req.document_id,
        limit=req.top_k
    )

    sources = []
    context_blocks = []
    for h in hits:
        pl = h.payload or {}
        txt = (pl.get("text") or "").strip()
        if not txt:
            continue
        sources.append({
            "doc_id": req.document_id,
            "file": pl.get("file"),
            "page": pl.get("page"),
            "score": float(h.score) if h.score is not None else None,
            "text": txt[:500]
        })
        context_blocks.append(f"[page {pl.get('page')}]
{txt}")

    context = "\n\n---\n\n".join(context_blocks[: req.top_k])

    system = (
        "You are a strict RAG assistant. Answer ONLY using the provided context. "
        "If the answer is not in context, say you don't know. "
        "Always be concise. Include page citations like (p. 3) when relevant."
    )

    user = f"Context:\n{context}\n\nQuestion: {req.message}\nAnswer:"

    answer = chat(system=system, user=user)

    return {
        "answer": answer,
        "sources": sources[: req.top_k],
        "metadata": {
            "retrieved": len(sources),
            "top_k": req.top_k
        }
    }

def delete_doc(req):
    qdrant_store.delete_by_filter(req.user_id, req.project_id, req.document_id)
    return {"status": "deleted", "document_id": req.document_id}
