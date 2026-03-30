from server.rag.pdf_processing.pdf_loader import PDFLoader
from server.rag.pdf_processing.text_cleaner import TextCleaner
from server.rag.pdf_processing.text_chunker import TextChunker
from server.rag.embeddings.embedding_model import EmbeddingModel
from server.rag.vector_store.faiss_store import FAISSStore
from server.rag.retrieval.retriever import Retriever
from server.rag.llm.llm_client import LLMClient

class RAGPipeline:
    """
    Main orchestration class for the Retrieval-Augmented Generation (RAG) system.
    Handles indexing of documents and processing of queries.
    """
    
    def __init__(self):
        self.embedding_model = EmbeddingModel()
        self.vector_store = FAISSStore(dimension=384) # 384 for all-MiniLM-L6-v2
        self.retriever = Retriever(self.embedding_model, self.vector_store)
        self.llm_client = LLMClient()
        self.chunker = TextChunker(chunk_size=600, overlap=150)
        self.is_indexed = False
        
    def index_document(self, file_path: str) -> dict:
        """
        End-to-end process of reading a PDF, processing, embedding, and indexing.
        """
        # 1. Load PDF
        pages = PDFLoader.extract_text(file_path)
        
        # 2. Clean text
        for page in pages:
            page["text"] = TextCleaner.clean(page["text"])
            
        # 3. Create Chunks
        chunks = self.chunker.chunk_text(pages)
        
        # 4. Generate Embeddings & Store
        texts_to_embed = [c["text"] for c in chunks]
        embeddings = self.embedding_model.get_embeddings(texts_to_embed)
        self.vector_store.add_texts(embeddings, chunks)
        
        self.is_indexed = True
        
        return {
            "num_pages": len(pages),
            "num_chunks": len(chunks),
            "status": "success"
        }
        
    def query(self, question: str) -> dict:
        """
        Handles user queries by retrieving context and generating an answer.
        """
        if not self.is_indexed:
            return {"answer": "Error: Please upload and index a document first.", "sources": []}
            
        # 1. Retrieve relevant chunks
        relevant_chunks = self.retriever.retrieve(question, top_k=3)
        
        # 2. Build context
        context_text = "\n\n".join([chunk["text"] for chunk in relevant_chunks])
        
        # 3. Generate Answer
        answer = self.llm_client.generate_answer(question, context_text)
        
        # 4. Extract unique sources (pages)
        all_pages = []
        for chunk in relevant_chunks:
            all_pages.extend(chunk.get("pageNums", []))
        unique_pages = sorted(list(set(all_pages)))
        sources = [f"Page {p}" for p in unique_pages]
        
        return {
            "answer": answer,
            "sources": sources
        }
