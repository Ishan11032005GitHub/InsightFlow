from flask import jsonify

class ReportController:
    @staticmethod
    def generate_report(dataset_id: str):
        if not dataset_id:
            return jsonify({"error": "Dataset ID required"}), 400
        return jsonify({"message": f"Report generated for dataset {dataset_id}", "report_id": "rep-456"}), 201

    @staticmethod
    def get_reports():
        return jsonify({"reports": []}), 200
