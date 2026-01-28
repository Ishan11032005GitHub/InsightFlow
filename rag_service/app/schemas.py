from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class IngestRequest(BaseModel):
    user_id: str
    project_id: str
    document_id: str
    file_path: str
    original_name: Optional[str] = None
    mime_type: Optional[str] = None

class QueryRequest(BaseModel):
    user_id: str
    project_id: str
    document_id: str
    message: str
    session_id: Optional[str] = None
    top_k: int = Field(default=6, ge=1, le=20)

class DeleteRequest(BaseModel):
    user_id: str
    project_id: str
    document_id: str

class Source(BaseModel):
    doc_id: str
    file: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None
    text: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Source]
    metadata: Dict[str, Any] = {}
