import re
from typing import List, Dict, Any

class TextChunker:
    """
    TextChunker splits text from documents into overlapping chunks 
    to preserve context for Retrieval-Augmented Generation (RAG).
    """
    def __init__(self, chunk_size: int = 600, overlap: int = 150):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_text(self, pages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Splits text from pages into overlapping chunks.
        
        Args:
            pages: List of dictionaries like [{'pageNum': 1, 'text': 'page content...'}]
            
        Returns:
            List of chunks with metadata: [{'text': 'chunk content...', 'pageNums': [1, 2], 'chunkIndex': 0}]
        """
        chunks = []
        current_chunk = ""
        current_pages = []
        chunk_index = 0

        for page in pages:
            page_num = page.get('pageNum', 0)
            text = page.get('text', '')
            
            # Simple sentence splitting regex
            sentences = re.split(r'(?<=[.!?])\s+', text)
            
            for sentence in sentences:
                trimmed_sentence = sentence.strip()
                if not trimmed_sentence:
                    continue
                
                # Check if adding this sentence exceeds the chunk size
                if len(current_chunk) + len(trimmed_sentence) > self.chunk_size and len(current_chunk) > 0:
                    chunks.append({
                        'text': current_chunk.strip(),
                        'pageNums': list(set(current_pages)),
                        'chunkIndex': chunk_index
                    })
                    chunk_index += 1
                    
                    # Create overlap text from the end of the current chunk
                    overlap_text = current_chunk[-self.overlap:] if len(current_chunk) >= self.overlap else current_chunk
                    # Start new chunk with overlap + new sentence
                    current_chunk = overlap_text + ' ' + trimmed_sentence
                    
                    # Keep the last page number to continue tracking context
                    current_pages = [current_pages[-1]] if current_pages else []
                    if page_num not in current_pages:
                        current_pages.append(page_num)
                else:
                    # Append sentence to current chunk
                    current_chunk += (' ' if current_chunk else '') + trimmed_sentence
                    if page_num not in current_pages:
                        current_pages.append(page_num)
                        
        # Append any remaining text as the final chunk
        if current_chunk.strip():
            chunks.append({
                'text': current_chunk.strip(),
                'pageNums': list(set(current_pages)),
                'chunkIndex': chunk_index
            })
            
        return chunks
