from flask import Blueprint, request
from controllers.authController import AuthController

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    return AuthController.login(data.get('email'), data.get('password'))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    return AuthController.register(data.get('email'), data.get('name'), data.get('password'))
