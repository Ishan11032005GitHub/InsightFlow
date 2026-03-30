from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Any

@dataclass
class Report:
    id: str
    dataset_id: str
    user_id: str
    title: str
    summary_data: Dict[str, Any]
    created_at: datetime = datetime.now()
    
    def to_dict(self):
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at.isoformat()
        }
