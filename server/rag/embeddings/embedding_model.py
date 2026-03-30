class EmbeddingModel:
    """Generates vector embeddings for text chunks."""
    
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        
    def _load_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            except ImportError:
                print("Warning: sentence_transformers not installed. Returning dummy embeddings.")
                print("To fix, run: pip install sentence_transformers")
                
    def get_embedding(self, text: str) -> list:
        """Returns the embedding vector for a given text."""
        self._load_model()
        if self.model:
            return self.model.encode(text).tolist()
        else:
            # Dummy embedding fallback
            return [0.0] * 384
            
    def get_embeddings(self, texts: list) -> list:
        """Returns embeddings for a list of texts."""
        self._load_model()
        if self.model:
            return self.model.encode(texts).tolist()
        else:
            return [[0.0] * 384 for _ in texts]
