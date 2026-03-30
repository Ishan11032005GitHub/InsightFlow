import re

class TextCleaner:
    """Cleans extracted text to remove artifacts, extra whitespace, and special characters."""
    
    @staticmethod
    def clean(text: str) -> str:
        if not text:
            return ""
            
        # Remove multiple newlines
        text = re.sub(r'\n+', '\n ', text)
        # Remove multiple spaces
        text = re.sub(r'\s+', ' ', text)
        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char in ['\n', '\t'])
        
        return text.strip()
