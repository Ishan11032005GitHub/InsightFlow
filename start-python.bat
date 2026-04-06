@echo off
echo Starting InsightFlow Python RAG Service...
cd rag_service
call .venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
