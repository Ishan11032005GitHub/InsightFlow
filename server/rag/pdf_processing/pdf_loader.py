import os

class PDFLoader:
    """PDFLoader handles the extraction of text from PDF files."""
    
    @staticmethod
    def extract_text(file_path: str) -> list:
        """
        Extracts text from a given PDF file and returns it as a list of page dictionaries.
        
        Args:
            file_path: Path to the PDF file.
            
        Returns:
            List of dictionaries: [{'pageNum': 1, 'text': '...'}, ...]
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at {file_path}")
            
        pages = []
        try:
            import PyPDF2
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for i, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text:
                        pages.append({
                            'pageNum': i + 1,
                            'text': text.strip()
                        })
        except ImportError:
            # Fallback if PyPDF2 is not installed
            pages.append({
                'pageNum': 1,
                'text': "Please install PyPDF2 to extract real text: pip install PyPDF2"
            })
            
        return pages
