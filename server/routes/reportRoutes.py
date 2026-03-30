from flask import Blueprint, request
from controllers.reportController import ReportController
from middleware.authMiddleware import require_auth

report_bp = Blueprint('report_bp', __name__)

@report_bp.route('/', methods=['GET'])
@require_auth
def list_reports():
    return ReportController.get_reports()

@report_bp.route('/generate', methods=['POST'])
@require_auth
def generate_report():
    data = request.get_json() or {}
    return ReportController.generate_report(data.get('dataset_id'))
