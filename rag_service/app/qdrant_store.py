import os
from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION = os.getenv("QDRANT_COLLECTION", "insightflow_chunks")

def client() -> QdrantClient:
    return QdrantClient(url=QDRANT_URL)

def ensure_collection(dim: int):
    c = client()
    existing = [col.name for col in c.get_collections().collections]
    if COLLECTION in existing:
        return
    c.create_collection(
        collection_name=COLLECTION,
        vectors_config=qm.VectorParams(size=dim, distance=qm.Distance.COSINE),
        optimizers_config=qm.OptimizersConfigDiff(indexing_threshold=20000),
    )

def upsert(points):
    c = client()
    c.upsert(collection_name=COLLECTION, points=points)

def delete_by_filter(user_id: str, project_id: str, document_id: str):
    c = client()
    flt = qm.Filter(
        must=[
            qm.FieldCondition(key="user_id", match=qm.MatchValue(value=user_id)),
            qm.FieldCondition(key="project_id", match=qm.MatchValue(value=project_id)),
            qm.FieldCondition(key="document_id", match=qm.MatchValue(value=document_id)),
        ]
    )
    c.delete(collection_name=COLLECTION, points_selector=qm.FilterSelector(filter=flt))

def search(query_vector, user_id: str, project_id: str, document_id: str, limit: int):
    c = client()
    flt = qm.Filter(
        must=[
            qm.FieldCondition(key="user_id", match=qm.MatchValue(value=user_id)),
            qm.FieldCondition(key="project_id", match=qm.MatchValue(value=project_id)),
            qm.FieldCondition(key="document_id", match=qm.MatchValue(value=document_id)),
        ]
    )
    return c.search(
        collection_name=COLLECTION,
        query_vector=query_vector,
        limit=limit,
        query_filter=flt,
        with_payload=True
    )
