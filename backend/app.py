from flask import Flask, request, jsonify
from flask_cors import CORS  # <-- add this
from datetime import datetime
import os
from werkzeug.utils import secure_filename

# Import the User model and db instance
from models.user import User, db
# Import auth utilities
from utils.auth import token_required, generate_token, refresh_token

app = Flask(__name__)
CORS(app)  # <-- enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'png', 'jpg', 'jpeg'}
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 30  # Token expires in 30 minutes

# Initialize database with app
db.init_app(app)

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Routes
@app.route('/api/register', methods=['POST'])
def register():
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

        # Generate token for new user
        token = generate_token(new_user.id, app.config['JWT_ACCESS_TOKEN_EXPIRES'])

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
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

        user = User.query.filter_by(username=data['username']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid username or password'}), 400

        # Generate token with expiration
        token = generate_token(user.id, app.config['JWT_ACCESS_TOKEN_EXPIRES'])

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'token_expires_in_minutes': app.config['JWT_ACCESS_TOKEN_EXPIRES'],
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

        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({'message': 'File type not allowed'}), 400

        # Secure the filename and save the file
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)

        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'path': file_path
        }), 200

    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@app.route('/api/protected', methods=['GET'])
@token_required
def protected(current_user):
    return jsonify({
        'message': 'This is a protected route',
        'user': current_user.to_dict()
    }), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5050) 