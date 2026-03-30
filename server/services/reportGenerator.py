import uuid
from typing import Dict, Any

class ReportGenerator:
    @staticmethod
    def create_report(dataset_name: str, analysis_results: Dict[str, Any], insights: list) -> dict:
        """Compiles analysis into a structured report."""
        return {
            "report_id": str(uuid.uuid4()),
            "dataset_name": dataset_name,
            "summary": analysis_results.get("stats", []),
            "insights": insights,
            "status": "completed"
        }
