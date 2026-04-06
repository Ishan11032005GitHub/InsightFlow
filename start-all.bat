@echo off
echo Starting InsightFlow Backend Server...
start "Node Backend" cmd /c "cd Backend && npm start"

echo Starting InsightFlow Python RAG Service...
start "Python RAG" cmd /c "cd rag_service && call .venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo Starting frontend locally (please open Frontend/intro.html in your browser)
pause
