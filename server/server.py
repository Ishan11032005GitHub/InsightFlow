from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

# Load .env file
from pathlib import Path
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

from routes.authRoutes import auth_bp
from routes.chatRoutes import chat_bp
from routes.datasetRoutes import dataset_bp
from routes.reportRoutes import report_bp

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(dataset_bp, url_prefix='/api/datasets')
app.register_blueprint(report_bp, url_prefix='/api/reports')

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    # Initialize basic folders
    os.makedirs('uploads', exist_ok=True)
    os.makedirs('data_store', exist_ok=True)
    app.run(host='0.0.0.0', port=5001, debug=True)
