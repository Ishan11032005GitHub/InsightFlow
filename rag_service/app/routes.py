from fastapi import APIRouter, HTTPException
from app.schemas import IngestRequest, QueryRequest, DeleteRequest
from app.service import ingest_pdf, query_rag, delete_doc

router = APIRouter()

@router.post("/v1/ingest")
def ingest(req: IngestRequest):
    try:
        return ingest_pdf(req)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/query")
def query(req: QueryRequest):
    try:
        return query_rag(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/v1/delete")
def delete(req: DeleteRequest):
    try:
        return delete_doc(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
