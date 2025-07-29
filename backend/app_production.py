from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging
import os
from helpers import summarize_collection
import feedparser

# Set up logging
logging.basicConfig(level=logging.INFO)  # Use INFO for production
logger = logging.getLogger(__name__)

load_dotenv()

app = Flask(__name__)

# Production CORS configuration
allowed_origins = [
    "https://globe-6d4elgnr0-tungvoxs-projects.vercel.app",  # Your latest Vercel domain
    "https://globe-pi-six.vercel.app",  # Your custom Vercel domain
    "https://globe-jvaox3vb4-tungvoxs-projects.vercel.app",  # Your previous Vercel domain
    "https://globe-d7f6cmn3t-tungvoxs-projects.vercel.app",  # Your old Vercel domain
    "https://globe-1-hduo.onrender.com",  # Your backend domain
    "http://localhost:3000",  # For local development
    "http://localhost:5173",  # For Vite dev server
]

# Add any vercel.app domains dynamically
import os
vercel_url = os.getenv('VERCEL_URL')
if vercel_url:
    allowed_origins.append(f"https://{vercel_url}")

# Add common Vercel domain patterns
vercel_patterns = [
    "https://*.vercel.app",
    "https://*.vercel.app/*"
]

# Add any additional domains from environment
additional_domains = os.getenv('ADDITIONAL_CORS_DOMAINS', '').split(',')
for domain in additional_domains:
    if domain.strip():
        allowed_origins.append(domain.strip())

CORS(app, origins=allowed_origins, supports_credentials=True)

# Production SocketIO configuration
socketio = SocketIO(app, 
    cors_allowed_origins=allowed_origins,
    logger=True,
    engineio_logger=True
)

COPERNICUS_AUTH_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"

# Global variable to store fetched demo data
cached_demo_data = None

def get_copernicus_token():
    username = os.getenv("COPERNICUS_USERNAME")
    password = os.getenv("COPERNICUS_PASSWORD")
    
    if not username or not password:
        logger.error("Copernicus credentials not found in environment variables")
        return None
    
    auth_data = {
        "username": username,
        "password": password,
        "grant_type": "password",
        "client_id": "cdse-public"
    }
    
    try:
        response = requests.post(COPERNICUS_AUTH_URL, data=auth_data, timeout=30)
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            logger.error(f"Authentication failed: {response.status_code} - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error during authentication: {e}")
        return None

# Health check endpoint for deployment platforms
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()}), 200

# Import all your existing routes here
# You can copy the routes from your original app.py file

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False) 