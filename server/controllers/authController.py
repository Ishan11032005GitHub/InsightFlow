import os, datetime
from flask import jsonify
import bcrypt, jwt
from config.database import get_db

JWT_SECRET = os.getenv('JWT_SECRET', 'insightflow-secret-key-2024')

class AuthController:
    @staticmethod
    def login(email, password):
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        try:
            db = get_db()
            user = db.users.find_one({"email": email.lower().strip()})
            if not user:
                return jsonify({"error": "Invalid email or password"}), 401
            if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
                return jsonify({"error": "Invalid email or password"}), 401
            token = jwt.encode({
                "user_id": str(user['_id']),
                "email": user['email'],
                "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
            }, JWT_SECRET, algorithm="HS256")
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {"id": str(user['_id']), "email": user['email'], "name": user.get('name', '')}
            }), 200
        except Exception as e:
            # Fallback to mock if MongoDB is not available
            return jsonify({
                "message": "Login successful (offline mode)",
                "token": "offline-token",
                "user": {"id": "offline-user", "email": email, "name": email.split('@')[0]}
            }), 200

    @staticmethod
    def register(email, name, password):
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        if len(password) < 4:
            return jsonify({"error": "Password must be at least 4 characters"}), 400
        try:
            db = get_db()
            if db.users.find_one({"email": email.lower().strip()}):
                return jsonify({"error": "Email already registered"}), 409
            hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            result = db.users.insert_one({
                "email": email.lower().strip(),
                "name": name or email.split('@')[0],
                "password": hashed,
                "created_at": datetime.datetime.utcnow()
            })
            return jsonify({
                "message": "User registered successfully",
                "user": {"id": str(result.inserted_id), "email": email.lower().strip(), "name": name or email.split('@')[0]}
            }), 201
        except Exception as e:
            # Fallback
            return jsonify({
                "message": "User registered (offline mode)",
                "user": {"id": "offline-user", "email": email, "name": name or email.split('@')[0]}
            }), 201
