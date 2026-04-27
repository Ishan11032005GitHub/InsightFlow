from flask import Blueprint, request
from controllers.chatController import ChatController
from middleware.authMiddleware import require_auth

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route('/query', methods=['POST'])
@require_auth
def query_document():
    data = request.get_json() or {}
    return ChatController.process_query(data.get('query'), data.get('document_id'))

@chat_bp.route('/generate', methods=['POST'])
def generate_answer():
    data = request.get_json() or {}
    return ChatController.generate_answer(data.get('query'), data.get('context'))

@chat_bp.route('/ai', methods=['POST'])
def ai_chat():
    data = request.get_json() or {}
    return ChatController.ai_chat(data.get('messages', []), user_info=data.get('user'))
