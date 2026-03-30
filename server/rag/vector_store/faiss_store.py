import numpy as np

class FAISSStore:
    """FAISS-based vector store for efficient similarity search."""
    
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index = None
        self.metadata = []
        self._init_index()
        
    def _init_index(self):
        try:
            import faiss
            self.index = faiss.IndexFlatL2(self.dimension)
        except ImportError:
            print("Warning: faiss not installed. Search will use basic numpy operations.")
            print("To fix, run: pip install faiss-cpu")
            self.index = None
            self.vectors = []

    def add_texts(self, embeddings: list, chunks_metadata: list):
        """Adds text chunks and their embeddings to the store."""
        if not embeddings:
            return
            
        emb_array = np.array(embeddings).astype('float32')
        
        if self.index is not None:
            self.index.add(emb_array)
        else:
            self.vectors.extend(embeddings)
            
        self.metadata.extend(chunks_metadata)

    def search(self, query_embedding: list, top_k: int = 3) -> list:
        """Searches for the top_k most similar chunks to the query embedding."""
        if not self.metadata:
            return []
            
        query_array = np.array([query_embedding]).astype('float32')
        
        if self.index is not None:
            distances, indices = self.index.search(query_array, min(top_k, len(self.metadata)))
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1 and idx < len(self.metadata):
                    results.append({
                        "chunk": self.metadata[idx],
                        "distance": float(distances[0][i])
                    })
            return results
        else:
            # Fallback exact distance calculation
            v = np.array(self.vectors)
            q = query_array[0]
            distances = np.linalg.norm(v - q, axis=1)
            indices = np.argsort(distances)[:min(top_k, len(self.metadata))]
            
            return [{
                "chunk": self.metadata[idx],
                "distance": float(distances[idx])
            } for idx in indices]
