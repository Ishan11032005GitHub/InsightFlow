from flask import Blueprint, request, jsonify
from controllers.datasetController import DatasetController
from middleware.authMiddleware import require_auth
from config.database import get_db
import datetime
from bson import ObjectId

dataset_bp = Blueprint('dataset_bp', __name__)
controller = DatasetController()

@dataset_bp.route('/', methods=['GET'])
@require_auth
def list_datasets():
    return jsonify(controller.list_datasets())

@dataset_bp.route('/upload', methods=['POST'])
@require_auth
def upload_dataset():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    return jsonify(controller.upload_dataset(file, file.filename))

@dataset_bp.route('/analyze', methods=['POST'])
def analyze_data():
    """AI-powered data analysis — returns summary, chart recommendations, and insights."""
    data = request.get_json()
    if not data or 'columns' not in data or 'sampleData' not in data:
        return jsonify({"error": "columns and sampleData are required"}), 400
    return DatasetController.analyze_with_ai(data)

@dataset_bp.route('/ask', methods=['POST'])
def ask_about_data():
    """Ask AI a question about the uploaded data."""
    data = request.get_json()
    if not data or 'question' not in data or 'columns' not in data:
        return jsonify({"error": "question and columns are required"}), 400
    return DatasetController.ask_data_question(data)

@dataset_bp.route('/analyses', methods=['POST'])
def save_analysis():
    """Save an analysis result for later."""
    data = request.get_json()
    if not data or 'fileName' not in data:
        return jsonify({"error": "fileName is required"}), 400
    try:
        db = get_db()
        doc = {
            "fileName": data['fileName'],
            "summary": data.get('summary', ''),
            "insights": data.get('insights', []),
            "charts": data.get('charts', []),
            "rowCount": data.get('rowCount', 0),
            "columns": data.get('columns', []),
            "created_at": datetime.datetime.utcnow(),
        }
        result = db.analyses.insert_one(doc)
        return jsonify({"message": "Analysis saved", "id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dataset_bp.route('/analyses', methods=['GET'])
def list_analyses():
    """List past saved analyses."""
    try:
        db = get_db()
        analyses = list(db.analyses.find().sort("created_at", -1).limit(50))
        for a in analyses:
            a['_id'] = str(a['_id'])
            if 'created_at' in a:
                a['created_at'] = a['created_at'].isoformat()
        return jsonify(analyses), 200
    except Exception as e:
        return jsonify([]), 200

@dataset_bp.route('/analyses/<analysis_id>', methods=['DELETE'])
def delete_analysis(analysis_id):
    """Delete a saved analysis."""
    try:
        db = get_db()
        db.analyses.delete_one({"_id": ObjectId(analysis_id)})
        return jsonify({"message": "Deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
