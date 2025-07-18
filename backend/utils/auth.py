from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import jsonify, request, current_app
from models.user import User
from utils.logger import get_logger

def generate_token(user_id, expires_in_minutes):
    try:
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        # Create payload
        payload = {
            'user_id': user_id,
            'exp': expires_at
        }
        
        # Generate token
        token = jwt.encode(
            payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        
        return token
    except Exception as e:
        print(f"Token generation error: {str(e)}")
        return None

def token_required(f):
    logger = get_logger("auth")
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except:
                logger.warning('Invalid token format')
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            logger.warning('Token is missing')
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode token
            payload = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Get user from database
            current_user = User.query.get(payload['user_id'])
            if not current_user:
                logger.warning('User not found for token')
                return jsonify({'message': 'User not found'}), 401
            logger.info(f'Authenticated user {current_user.id}')
            return f(current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            logger.warning('Token has expired')
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            logger.warning('Invalid token')
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            logger.error(f'Internal server error: {str(e)}')
            return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

    return decorated

def refresh_token(current_token, expires_in_minutes):
    try:
        # Decode current token
        payload = jwt.decode(
            current_token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        
        # Generate new token with same user_id
        new_token = generate_token(payload['user_id'], expires_in_minutes)
        return new_token
    except jwt.ExpiredSignatureError:
        return None
    except Exception as e:
        print(f"Token refresh error: {str(e)}")
        return None 