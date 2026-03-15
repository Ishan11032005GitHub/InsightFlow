import os
import uuid

from pypdf import PdfReader
from qdrant_client.http import models as qm

from app.embeddings import batch_embed
from app.llm import chat
from app import qdrant_store


def normalize_request(req):

    return {
        "user_id": str(req.get("user_id") or req.get("userId")),
        "project_id": str(req.get("project_id") or req.get("projectId") or "default"),
        "document_id": str(req.get("document_id") or req.get("documentId")),
        "file_path": req.get("file_path") or req.get("filePath"),
        "original_name": req.get("original_name") or req.get("originalName"),
        "mime_type": req.get("mime_type") or req.get("mimeType")
    }


def chunk_text(text, chunk_size=800, overlap=150):

    chunks = []
    start = 0

    while start < len(text):

        end = min(start + chunk_size, len(text))

        chunk = text[start:end].strip()

        if chunk:
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


def ingest_pdf(req):

    req = normalize_request(req)

    file_path = os.path.abspath(req["file_path"])

    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path)

    pages = read_pdf(file_path)

    texts = []
    payloads = []

    for p in pages:

        chunks = chunk_text(p["text"])

        for chunk in chunks:

            texts.append(chunk)

            payloads.append({
                "user_id": req["user_id"],
                "project_id": req["project_id"],
                "document_id": req["document_id"],
                "file": req["original_name"],
                "page": p["page"],
                "text": chunk
            })

    vectors = batch_embed(texts)

    dim = len(vectors[0])

    qdrant_store.ensure_collection(dim)

    points = []

    for vec, payload in zip(vectors, payloads):

        points.append(
            qm.PointStruct(
                id=str(uuid.uuid4()),
                vector=vec,
                payload=payload
            )
        )

    qdrant_store.upsert(points)

    return {
        "status": "ingested",
        "chunks": len(points)
    }


def query_rag(req):

    req = normalize_request(req)

    qvec = batch_embed([req["message"]])[0]

    hits = qdrant_store.search(
        query_vector=qvec,
        user_id=req["user_id"],
        project_id=req["project_id"],
        limit=6
    )

    context_blocks = []

    for h in hits:

        payload = h.payload or {}

        context_blocks.append(
        f"""
            PAGE {payload.get('page')}
            {text}
        """
        )

    context = "\n\n".join(context_blocks)

    system = """
You are a document analysis assistant.

Use the provided document context to answer the question.

Instructions:
- If the user asks for a summary, produce a concise summary of the document.
- If the user asks about a person, extract the relevant details from the document.
- Quote or reference document sections when useful.
- If the information truly does not exist in the document, say so.

Context may contain multiple document chunks.
Combine them to produce the best answer.
"""

    user = f"""
Context:
{context}

Question:
{req["message"]}
"""

    answer = chat(system, user)

    return {
        "answer": answer
    }


def delete_doc(req):

    req = normalize_request(req)

    qdrant_store.delete_by_filter(
        req["user_id"],
        req["project_id"],
        req["document_id"]
    )

    return {"status": "deleted"}