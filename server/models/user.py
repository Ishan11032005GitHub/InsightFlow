from dataclasses import dataclass
from datetime import datetime

@dataclass
class User:
    id: str
    email: str
    name: str
    password_hash: str
    created_at: datetime = datetime.now()
    
    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "created_at": self.created_at.isoformat()
        }
