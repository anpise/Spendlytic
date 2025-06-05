from flask import Blueprint, request, jsonify, current_app
from models.user import User, db
from utils.auth import generate_token, refresh_token, token_required
from utils.logger import get_logger
from config import *
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

logger = get_logger(__name__)
auth_bp = Blueprint('auth', __name__, url_prefix='/api')

# Use the limiter from the main app
limiter = Limiter(key_func=get_remote_address)

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10/day")
def register():
    logger.info("Registering new user")
    try:
        data = request.get_json()
        if not data:
            logger.info("Registration failed: malformed JSON or no data")
            return jsonify({'message': 'Malformed request. Please send valid JSON.'}), 400
        if not all(k in data for k in ['username', 'email', 'password']):
            logger.info("Registration failed: missing required fields")
            return jsonify({'message': 'Username, email, and password are required.'}), 400
        if len(data['password']) < 6:
            logger.info("Registration failed: password too short")
            return jsonify({'message': 'Password must be at least 6 characters long.'}), 400
        if User.query.filter_by(username=data['username']).first():
            logger.info(f"Registration failed: username {data['username']} already exists")
            return jsonify({'message': 'Username already exists.'}), 409
        if User.query.filter_by(email=data['email']).first():
            logger.info(f"Registration failed: email {data['email']} already exists")
            return jsonify({'message': 'Email already exists.'}), 409
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

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10/day")
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
        token = generate_token(user.id, int(current_app.config['JWT_ACCESS_TOKEN_EXPIRES']))
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

@auth_bp.route('/refresh-token', methods=['POST'])
@token_required
def refresh(current_user):
    try:
        logger.info(f"Token refresh requested by user {current_user.id}")
        # Get current token from header
        auth_header = request.headers.get('Authorization')
        current_token = auth_header.split(" ")[1]
        
        # Generate new token
        new_token = refresh_token(current_token, current_app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        
        if new_token:
            logger.info(f"Token refreshed successfully for user {current_user.id}")
            return jsonify({
                'message': 'Token refreshed successfully',
                'token': new_token,
                'token_expires_in_minutes': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
            }), 200
        else:
            logger.info(f"Invalid token refresh attempt by user {current_user.id}")
            return jsonify({'message': 'Invalid token'}), 401

    except Exception as e:
        logger.error(f"Token refresh error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500 