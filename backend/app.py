from flask import Flask, request, jsonify
from datetime import datetime
import os
from werkzeug.utils import secure_filename
from models.user import User, db
from utils.auth import token_required, generate_token, refresh_token
from config import *
from utils.data_extraction import DataExtractor
from utils.ai_services import AIServices
from models.bill import Bill
from models.item import Item
from flask_cors import CORS
import logging

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

# Load configuration
app.config['SECRET_KEY'] = SECRET_KEY
app.config['DEBUG'] = DEBUG
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = SQLALCHEMY_TRACK_MODIFICATIONS
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = int(MAX_CONTENT_LENGTH)
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
    db.create_all()
    logger.info("Database tables created successfully")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS'].split(',')

@app.route('/api/register', methods=['POST'])
def register():
    logger.info("Registering new user")
    try:
        data = request.get_json()

        # Check if required fields are present
        if not all(k in data for k in ['username', 'email', 'password']):
            logger.info("Registration failed: missing required fields")
            return jsonify({'message': 'Missing required fields'}), 400

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            logger.info(f"Registration failed: username {data['username']} already exists")
            return jsonify({'message': 'Username already exists'}), 400

        if User.query.filter_by(email=data['email']).first():
            logger.info(f"Registration failed: email {data['email']} already exists")
            return jsonify({'message': 'Email already exists'}), 400

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
        }), 200

    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not all(k in data for k in ['username', 'password']):
            logger.info("Login failed: missing username or password")
            return jsonify({'message': 'Missing username or password'}), 400

        # Try to find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['username'])
        ).first()

        if not user or not user.check_password(data['password']):
            logger.info(f"Login failed for username/email: {data['username']}")
            return jsonify({'message': 'Invalid username/email or password'}), 400

        # Generate token with expiration
        token = generate_token(user.id, int(app.config['JWT_ACCESS_TOKEN_EXPIRES']))

        if not token:
            logger.error("Failed to generate token during login")
            return jsonify({'message': 'Failed to generate token'}), 500

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

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            logger.info(f"File uploaded by user {current_user.id}: {filename}")
            try:
                # Extract text from file
                result = data_extractor.extract_text_from_file(file_path)
                
                
                if 'error' in result:
                    logger.error(f"Error processing file for user {current_user.id}: {result['error']}")
                    return jsonify({
                        'message': 'Error processing file',
                        'error': result['error']
                    }), 500
                
                
                # Upload the image to S3 after extraction
                from utils.data_extraction import DataExtractor
                DataExtractor.upload_image_to_s3(
                    file_path,
                    bucket_name=S3_BUCKET_NAME,
                    user_id=current_user.id,
                    content_type=file.content_type
                )
                
                logger.info(f"Image uploaded to S3 for user {current_user.id}: {filename}")
                
                # Save the extracted data to database
                bill = User.save_extracted_data(db, current_user.id, result['analysis'])
                
                logger.info(f"Extracted data saved to DB for user {current_user.id}, bill id: {bill.id}")
                
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

if __name__ == '__main__':
    app.run(debug=True) 