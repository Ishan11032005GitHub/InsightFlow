from flask import jsonify

class ChatController:
    @staticmethod
    def process_query(query: str, document_id: str):
        if not query:
            return jsonify({"error": "Query is required"}), 400
            
        # Placeholder for routing query to RAG Pipeline
        answer = f"This is an automated response to '{query}' for document {document_id}."
        sources = ["Page 1", "Page 2"]
        
        return jsonify({
            "answer": answer,
            "sources": sources
        }), 200
