import os
from dotenv import load_dotenv
import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError

# Load environment variables
load_dotenv()

# Flask settings
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
DEBUG = os.getenv('DEBUG', 'True')

# Database settings
DB_USERNAME = os.getenv('DB_USERNAME')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'spendlytic')

# Try PostgreSQL connection first
postgres_uri = f"postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
sqlite_uri = 'sqlite:///spendlytic.db'

try:
    # Test PostgreSQL connection
    engine = create_engine(postgres_uri)
    engine.connect()
    SQLALCHEMY_DATABASE_URI = postgres_uri
    print("Connected to PostgreSQL database")
except (OperationalError, Exception) as e:
    print(f"PostgreSQL connection failed: {str(e)}")
    print("Falling back to SQLite database")
    SQLALCHEMY_DATABASE_URI = sqlite_uri

SQLALCHEMY_TRACK_MODIFICATIONS = os.getenv('SQLALCHEMY_TRACK_MODIFICATIONS', 'False')

# File upload settings
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
MAX_CONTENT_LENGTH = os.getenv('MAX_CONTENT_LENGTH', '16777216')  # 16MB
ALLOWED_EXTENSIONS = os.getenv('ALLOWED_EXTENSIONS', 'pdf,png,jpg,jpeg')

# Rate limiting settings
RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100/hour')  # Default rate limit
RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')
RATELIMIT_STRATEGY = os.getenv('RATELIMIT_STRATEGY', 'fixed-window')

# Upload restrictions
MAX_TOTAL_UPLOADS = int(os.getenv('MAX_TOTAL_UPLOADS', '20'))  # Maximum total uploads per user
MAX_UPLOADS_PER_DAY = int(os.getenv('MAX_UPLOADS_PER_DAY', '5'))  # Maximum uploads per day
MAX_TOTAL_SIZE_PER_DAY = int(os.getenv('MAX_TOTAL_SIZE_PER_DAY', '104857600'))  # 100MB per day
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', '16777216'))  # 16MB per file

# JWT settings
JWT_ACCESS_TOKEN_EXPIRES = os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '30')

# AI Service settings
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')

# AWS settings
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1') 

# Google settings
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GOOGLE_DISCOVERY_URL = os.getenv('GOOGLE_DISCOVERY_URL')

# Frontend URL
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Environment
ENV = os.getenv('ENV', 'dev')

# Redis URL
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

