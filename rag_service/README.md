# InsightFlow RAG Service (FastAPI)

Endpoints:
- GET /health
- POST /v1/ingest
- POST /v1/query
- POST /v1/delete

This service expects local file paths from the Node backend (uploads/rag).
In production, replace file paths with S3 URLs + presigned downloads.
