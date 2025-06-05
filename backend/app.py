from flask import Flask, request, jsonify
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from models.user import User, db
from models.upload import Upload
from utils.auth import token_required, generate_token, refresh_token
from config import *
from utils.data_extraction import DataExtractor
from utils.ai_services import AIServices
from models.bill import Bill
from models.item import Item
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import logging
import re
from sqlalchemy.exc import IntegrityError

class CustomFormatter(logging.Formatter):
    def format(self, record):
        # Add route, method, and function name to the log record
        record.route = getattr(request, 'path', '-') if request else '-'
        record.method = getattr(request, 'method', '-') if request else '-'
        record.funcName = record.funcName
        return super().format(record)

log_format = '%(asctime)s - %(route)s - %(method)s - %(funcName)s - %(message)s'
handler = logging.StreamHandler()
handler.setFormatter(CustomFormatter(log_format))
logger = logging.getLogger(__name__)
logger.handlers = []  # Remove default handlers
logger.addHandler(handler)
logger.setLevel(logging.INFO)

app = Flask(__name__)
CORS(app)

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

@app.route('/api/register', methods=['POST'])
@limiter.limit("5/minute")
def register():
    logger.info("Registering new user")
    try:
        data = request.get_json()
        if not data:
            logger.info("Registration failed: malformed JSON or no data")
            return jsonify({'message': 'Malformed request. Please send valid JSON.'}), 400

        # Check if required fields are present
        if not all(k in data for k in ['username', 'email', 'password']):
            logger.info("Registration failed: missing required fields")
            return jsonify({'message': 'Username, email, and password are required.'}), 400


        # (Optional) Enforce password strength
        if len(data['password']) < 6:
            logger.info("Registration failed: password too short")
            return jsonify({'message': 'Password must be at least 6 characters long.'}), 400

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            logger.info(f"Registration failed: username {data['username']} already exists")
            return jsonify({'message': 'Username already exists.'}), 409

        if User.query.filter_by(email=data['email']).first():
            logger.info(f"Registration failed: email {data['email']} already exists")
            return jsonify({'message': 'Email already exists.'}), 409

        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )

        db.session.add(new_user)
        db.session.commit()

        logger.info(f"User registered successfully: {data['username']}")
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
@limiter.limit("10/minute")
def login():
    try:
        data = request.get_json()
        if not data:
            logger.info("Login failed: malformed JSON or no data")
            return jsonify({'message': 'Malformed request. Please send valid JSON.'}), 400

        if not all(k in data for k in ['username', 'password']):
            logger.info("Login failed: missing username or password")
            return jsonify({'message': 'Username and password are required.'}), 400

        user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['username'])
        ).first()

        if not user:
            logger.info(f"Login failed: user not found for {data['username']}")
            return jsonify({'message': 'No account found with that username or email.'}), 404

        if not user.check_password(data['password']):
            logger.info(f"Login failed: incorrect password for {data['username']}")
            return jsonify({'message': 'Incorrect password.'}), 401

        # (Optional) If you have an 'is_active' field:
        # if not user.is_active:
        #     logger.info(f"Login failed: inactive account for {data['username']}")
        #     return jsonify({'message': 'Account is inactive. Please contact support.'}), 403

        token = generate_token(user.id, int(app.config['JWT_ACCESS_TOKEN_EXPIRES']))
        if not token:
            logger.error("Failed to generate token during login")
            return jsonify({'message': 'Failed to generate authentication token.'}), 500

        logger.info(f"User logged in successfully: {data['username']}")
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/refresh-token', methods=['POST'])
@token_required
def refresh(current_user):
    try:
        logger.info(f"Token refresh requested by user {current_user.id}")
        # Get current token from header
        auth_header = request.headers.get('Authorization')
        current_token = auth_header.split(" ")[1]
        
        # Generate new token
        new_token = refresh_token(current_token, app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        
        if new_token:
            logger.info(f"Token refreshed successfully for user {current_user.id}")
            return jsonify({
                'message': 'Token refreshed successfully',
                'token': new_token,
                'token_expires_in_minutes': app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }), 200
        else:
            logger.info(f"Invalid token refresh attempt by user {current_user.id}")
            return jsonify({'message': 'Invalid token'}), 401

    except Exception as e:
        logger.error(f"Token refresh error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
@token_required
@limiter.limit("20/day")
def upload_file(current_user):
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            logger.info(f"Upload failed: No file part in request by user {current_user.id}")
            return jsonify({'message': 'No file part'}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            logger.info(f"Upload failed: No file selected by user {current_user.id}")
            return jsonify({'message': 'No file selected'}), 400

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            logger.info(f"Upload failed: File too large by user {current_user.id}")
            return jsonify({'message': f'File size exceeds maximum limit of {MAX_FILE_SIZE/1024/1024}MB'}), 400

        # Check upload limits
        is_allowed, error_message = check_upload_limits(current_user.id)
        if not is_allowed:
            logger.info(f"Upload failed: {error_message} for user {current_user.id}")
            return jsonify({'message': error_message}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            logger.info(f"File saved temporarily for user {current_user.id}: {filename}")

            try:
                data_extractor = DataExtractor()
                # Extract data from the image
                result = data_extractor.extract_text_from_file(file_path)
                # Upload the image to S3 after extraction
                data_extractor.upload_image_to_s3(
                    file_path,
                    bucket_name=S3_BUCKET_NAME,
                    user_id=current_user.id,
                    content_type=file.content_type
                )
                logger.info(f"Image uploaded to S3 for user {current_user.id}: {filename}")
                # Save the extracted data to database
                try:
                    bill = User.save_extracted_data(db, current_user.id, result['analysis'])
                except IntegrityError as ie:
                    db.session.rollback()
                    logger.error(f"Duplicate bill detected for user {current_user.id}: {str(ie)}")
                    return jsonify({'message': 'Duplicate bill not allowed. This bill already exists. Please upload a different bill.'}), 409
                logger.info(f"Extracted data saved to DB for user {current_user.id}, bill id: {bill.id}")
                # Create upload record only after successful bill creation
                upload = Upload(
                    user_id=current_user.id,
                    filename=filename,
                    file_size=file_size
                )
                db.session.add(upload)
                db.session.commit()
                logger.info(f"Upload record created for user {current_user.id}: {filename}")
                return jsonify({
                    'message': 'File uploaded and processed successfully',
                    'filename': filename,
                    'data': bill.to_dict()
                }), 200
            except Exception as e:
                logger.error(f"Error processing file for user {current_user.id}: {str(e)}")
                return jsonify({
                    'message': 'Error processing file',
                    'error': str(e)
                }), 500
            finally:
                # Clean up the file
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Temporary file deleted: {file_path}")

        return jsonify({'message': 'File type not allowed'}), 400

    except Exception as e:
        logger.error(f"Upload error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/protected', methods=['GET'])
@token_required
def protected(current_user):
    logger.info(f"Protected endpoint accessed by user {current_user.id}")
    return jsonify({
        'message': 'This is a protected route',
        'user': current_user.to_dict()
    }), 200

@app.route('/api/bills', methods=['GET'])
@token_required
def get_user_bills(current_user):
    try:
        logger.info(f"Bills requested by user {current_user.id}")
        # Get all bills for the current user
        bills = Bill.get_user_bills(db, current_user.id)
        
        # Convert bills to dictionary format
        bills_data = [bill.to_dict() for bill in bills]
        
        logger.info(f"Bills retrieved successfully for user {current_user.id}, count: {len(bills_data)}")
        return jsonify({
            'message': 'Bills retrieved successfully',
            'bills': bills_data
        }), 200
        
    except Exception as e:
        logger.error(f"Bills retrieval error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/bills/<int:bill_id>/items', methods=['GET'])
@token_required
def get_bill_items(current_user, bill_id):
    try:
        logger.info(f"Bill items requested for bill_id {bill_id} by user {current_user.id}")
        # First verify that the bill belongs to the current user
        bill = Bill.get_bill(db, bill_id)
        if not bill:
            logger.info(f"Bill not found: {bill_id} for user {current_user.id}")
            return jsonify({'message': 'Bill not found'}), 404
            
        if bill.user_id != current_user.id:
            logger.info(f"Unauthorized bill access attempt: bill_id {bill_id} by user {current_user.id}")
            return jsonify({'message': 'Unauthorized access to bill'}), 403
            
        # Convert items to dictionary format
        items_data = [item.to_dict() for item in bill.items]
        
        logger.info(f"Items retrieved for bill_id {bill_id} by user {current_user.id}, count: {len(items_data)}")
        return jsonify({
            'message': 'Items retrieved successfully',
            'items': items_data
        }), 200
        
    except Exception as e:
        logger.error(f"Bill items retrieval error for bill_id {bill_id} by user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    logger.info("Health check endpoint accessed")
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True) 