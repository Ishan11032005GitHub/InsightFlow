import os
import uuid
from typing import List, Dict, Any

from pypdf import PdfReader
from qdrant_client.http import models as qm

from app.schemas import IngestRequest, QueryRequest
from app import qdrant_store
from app.embeddings import embed
from app.llm import chat


def chunk_text(text, chunk_size=800, overlap=150):

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunk = text[start:end]

        chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def read_pdf(file_path):

    reader = PdfReader(file_path)

    pages = []

    for idx, page in enumerate(reader.pages):

        text = page.extract_text() or ""

        pages.append({
            "page": idx + 1,
            "text": text
        })

    return pages


def ingest_pdf(req: IngestRequest):

    if not os.path.exists(req.file_path):
        raise FileNotFoundError(req.file_path)

    pages = read_pdf(req.file_path)

    texts = []
    payloads = []

    for p in pages:

        chunks = chunk_text(p["text"])

        for chunk in chunks:

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
        return {"status": "failed"}

    vectors = embed(texts)

    dim = len(vectors[0])

    qdrant_store.ensure_collection(dim)

    points = []

    for vec, payload in zip(vectors, payloads):

        pid = str(uuid.uuid4())

        points.append(
            qm.PointStruct(
                id=pid,
                vector=vec,
                payload=payload
            )
        )

    qdrant_store.upsert(points)

    return {
        "status": "ingested",
        "chunks": len(points),
        "document_id": req.document_id
    }


def query_rag(req: QueryRequest):

    qvec = embed([req.message])[0]

    hits = qdrant_store.search(
        query_vector=qvec,
        user_id=req.user_id,
        project_id=req.project_id,
        limit=req.top_k
    )

    sources = []
    context_blocks = []

    for h in hits:

        payload = h.payload or {}

        text = payload.get("text", "").strip()

        if not text:
            continue

        sources.append({
            "doc_id": payload.get("document_id"),
            "file": payload.get("file"),
            "page": payload.get("page"),
            "score": h.score,
            "text": text[:400]
        })

        context_blocks.append(
            f"(p.{payload.get('page')}) {text}"
        )

    context = "\n\n".join(context_blocks[:req.top_k])

    system = """
You are a strict RAG assistant.

Answer ONLY using the provided context.

If the answer is not in the context say:
"I could not find this in the document."

Always cite page numbers like (p.3)
"""

    user = f"""
Context:
{context}

Question:
{req.message}

Answer:
"""

    answer = chat(system, user)

    return {
        "answer": answer,
        "sources": sources,
        "metadata": {
            "retrieved": len(sources)
        }
    }


def delete_doc(req):

    qdrant_store.delete_by_filter(
        req.user_id,
        req.project_id,
        req.document_id
    )

    return {
        "status": "deleted",
        "document_id": req.document_id
    }