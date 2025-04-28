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

app = Flask(__name__)

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

# Create all database tables
with app.app_context():
    db.create_all()
    print("Database tables created successfully")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS'].split(',')

@app.route('/api/register', methods=['POST'])
def register():
    print("Registering user")
    try:
        
        data = request.get_json()

        # Check if required fields are present
        if not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({'message': 'Missing required fields'}), 400

        # Check if user already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'Email already exists'}), 400

        # Create new user
        new_user = User(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not all(k in data for k in ['username', 'password']):
            return jsonify({'message': 'Missing username or password'}), 400

        # Try to find user by username or email
        user = User.query.filter(
            (User.username == data['username']) | 
            (User.email == data['username'])
        ).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid username/email or password'}), 400

        # Generate token with expiration
        token = generate_token(user.id, int(app.config['JWT_ACCESS_TOKEN_EXPIRES']))

        if not token:
            return jsonify({'message': 'Failed to generate token'}), 500

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/refresh-token', methods=['POST'])
@token_required
def refresh(current_user):
    try:
        # Get current token from header
        auth_header = request.headers.get('Authorization')
        current_token = auth_header.split(" ")[1]
        
        # Generate new token
        new_token = refresh_token(current_token, app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        
        if new_token:
            return jsonify({
                'message': 'Token refreshed successfully',
                'token': new_token,
                'token_expires_in_minutes': app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }), 200
        else:
            return jsonify({'message': 'Invalid token'}), 401

    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    try:
        # Check if file is present in request
        if 'file' not in request.files:
            return jsonify({'message': 'No file part'}), 400

        file = request.files['file']

        # Check if file is selected
        if file.filename == '':
            return jsonify({'message': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            try:
                # Extract text from file
                result = data_extractor.extract_text_from_file(file_path)
                
                
                if 'error' in result:
                    return jsonify({
                        'message': 'Error processing file',
                        'error': result['error']
                    }), 500
                
                print(result)
                
                # Save the extracted data to database
                bill = User.save_extracted_data(db, current_user.id, result['analysis'])
                
                return jsonify({
                    'message': 'File uploaded and processed successfully',
                    'filename': filename,
                    'data': bill.to_dict()
                }), 200

            except Exception as e:
                return jsonify({
                    'message': 'Error processing file',
                    'error': str(e)
                }), 500

            finally:
                # Clean up the file
                if os.path.exists(file_path):
                    os.remove(file_path)

        return jsonify({'message': 'File type not allowed'}), 400

    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/protected', methods=['GET'])
@token_required
def protected(current_user):
    return jsonify({
        'message': 'This is a protected route',
        'user': current_user.to_dict()
    }), 200

@app.route('/api/bills', methods=['GET'])
@token_required
def get_user_bills(current_user):
    try:
        # Get all bills for the current user
        bills = Bill.get_user_bills(db, current_user.id)
        
        # Convert bills to dictionary format
        bills_data = [bill.to_dict() for bill in bills]
        
        return jsonify({
            'message': 'Bills retrieved successfully',
            'bills': bills_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/bills/<int:bill_id>/items', methods=['GET'])
@token_required
def get_bill_items(current_user, bill_id):
    try:
        print(bill_id)
        # First verify that the bill belongs to the current user
        bill = Bill.get_bill(db, bill_id)
        if not bill:
            return jsonify({'message': 'Bill not found'}), 404
            
        if bill.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized access to bill'}), 403
            
        print(bill.to_dict())
        
        # Convert items to dictionary format
        items_data = [item.to_dict() for item in bill.items]
        
        return jsonify({
            'message': 'Items retrieved successfully',
            'items': items_data
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 