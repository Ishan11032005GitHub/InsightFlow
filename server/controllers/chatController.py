from flask import jsonify
from rag.rag_pipeline import RAGPipeline
from rag.llm.llm_client import LLMClient

# Singleton RAG pipeline instance
_rag_pipeline = None
_llm_client = None

def get_rag_pipeline():
    global _rag_pipeline
    if _rag_pipeline is None:
        _rag_pipeline = RAGPipeline()
    return _rag_pipeline

def get_llm_client():
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client

class ChatController:
    @staticmethod
    def index_document(file_path: str):
        """Index a PDF document for querying."""
        try:
            pipeline = get_rag_pipeline()
            result = pipeline.index_document(file_path)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def process_query(query: str, document_id: str):
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        try:
            pipeline = get_rag_pipeline()
            result = pipeline.query(query)
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def generate_answer(query: str, context: str):
        """Generate an answer using Gemini given context and a question."""
        if not query:
            return jsonify({"error": "Query is required"}), 400
        if not context:
            return jsonify({"error": "Context is required"}), 400
        
        try:
            llm = get_llm_client()
            answer = llm.generate_answer(query, context)
            return jsonify({"answer": answer}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @staticmethod
    def ai_chat(messages: list, user_info: dict = None):
        """General-purpose AI chat — works like ChatGPT/Gemini/Claude."""
        if not messages or len(messages) == 0:
            return jsonify({"error": "Messages are required"}), 400
        
        try:
            llm = get_llm_client()
            answer = llm.chat(messages, user_info=user_info)
            return jsonify({"answer": answer}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500
