from server.rag.embeddings.embedding_model import EmbeddingModel
from server.rag.vector_store.faiss_store import FAISSStore

class Retriever:
    """Coordinates the retrieval process from the vector store using an embedding model."""
    
    def __init__(self, embedding_model: EmbeddingModel, vector_store: FAISSStore):
        self.embedding_model = embedding_model
        self.vector_store = vector_store
        
    def retrieve(self, query: str, top_k: int = 3) -> list:
        """
        Retrieves the most relevant document chunks for the query.
        
        Args:
            query: The user's question.
            top_k: Number of relevant chunks to retrieve.
            
        Returns:
            List of dictionaries representing relevant chunks.
        """
        query_embedding = self.embedding_model.get_embedding(query)
        results = self.vector_store.search(query_embedding, top_k=top_k)
        
        # Return just the metadata chunks
        return [res["chunk"] for res in results]
