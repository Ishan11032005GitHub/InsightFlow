from flask import Blueprint, request, jsonify
from controllers.datasetController import DatasetController
from middleware.authMiddleware import require_auth

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
