from flask import Flask, request, jsonify
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from models.user import User, db
from models.upload import Upload
from config import *
from utils.data_extraction import DataExtractor
from utils.ai_services import AIServices
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import re
from sqlalchemy.exc import IntegrityError
from utils.logger import get_logger
from routes.auth import auth_bp, oauth
from routes.upload import upload_bp
from routes.bills import bills_bp
from routes.health import health_bp
from flask_caching import Cache
import redis

logger = get_logger(__name__)

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(bills_bp)
app.register_blueprint(health_bp)
oauth.init_app(app)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[RATELIMIT_DEFAULT],
    storage_uri=RATELIMIT_STORAGE_URL,
    strategy=RATELIMIT_STRATEGY
)

# Load configuration
app.config['SECRET_KEY'] = SECRET_KEY
app.config['DEBUG'] = DEBUG
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = JWT_ACCESS_TOKEN_EXPIRES
app.config['FRONTEND_URL'] = FRONTEND_URL
app.config['ENV'] = ENV


# Initialize database with app
db.init_app(app)

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize data extractor and AI services
data_extractor = DataExtractor()
ai_services = AIServices()

# Load S3 bucket name from environment
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'spendlytic')

# Create all database tables
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {str(e)}")

cache = Cache(config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_URL': REDIS_URL
})
cache.init_app(app)

redis_client = redis.Redis.from_url(REDIS_URL)
app.redis_client = redis_client

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS'].split(',')

def check_upload_limits(user_id):
    """
    Check if user has exceeded upload limits
    Returns: (bool, str) - (is_allowed, error_message)
    """
    # Check total uploads
    total_uploads = Upload.get_user_total_uploads(db, user_id)
    if total_uploads >= MAX_TOTAL_UPLOADS:
        return False, f"Total upload limit of {MAX_TOTAL_UPLOADS} files reached"
    
    # Check daily uploads
    daily_uploads = Upload.get_user_upload_count(db, user_id)
    if daily_uploads >= MAX_UPLOADS_PER_DAY:
        return False, f"Daily upload limit of {MAX_UPLOADS_PER_DAY} files reached"
    
    # Check total size
    total_size = Upload.get_user_total_size(db, user_id)
    if total_size >= MAX_TOTAL_SIZE_PER_DAY:
        return False, f"Daily storage limit of {MAX_TOTAL_SIZE_PER_DAY/1024/1024}MB reached"
    
    return True, None

if __name__ == '__main__':
    app.run(debug=True) 