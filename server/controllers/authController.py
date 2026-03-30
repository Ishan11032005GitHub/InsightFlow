import uuid
from flask import jsonify

class AuthController:
    @staticmethod
    def login(email, password):
        # Mock login
        if not email or not password:
            return jsonify({"error": "Missing credentials"}), 400
        return jsonify({
            "message": "Login successful",
            "token": "mock-jwt-token-123",
            "user": {"id": str(uuid.uuid4()), "email": email}
        }), 200

    @staticmethod
    def register(email, name, password):
        return jsonify({
            "message": "User registered successfully",
            "user": {"id": str(uuid.uuid4()), "email": email, "name": name}
        }), 201
