from dataclasses import dataclass
from datetime import datetime

@dataclass
class Dataset:
    id: str
    user_id: str
    filename: str
    file_path: str
    rows_count: int
    columns_count: int
    created_at: datetime = datetime.now()
    
    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "rows_count": self.rows_count,
            "columns_count": self.columns_count,
            "created_at": self.created_at.isoformat()
        }
