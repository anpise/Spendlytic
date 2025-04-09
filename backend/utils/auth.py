from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import jsonify, request, current_app

def generate_token(user_id, expires_in_minutes=30):
    """
    Generate a JWT token with expiration time
    """
    now = datetime.utcnow()
    payload = {
        'user_id': user_id,
        'iat': now,  # issued at
        'exp': now + timedelta(minutes=expires_in_minutes),  # expiration time
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm="HS256"
    )

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'message': 'Invalid token format',
                    'error': 'Token should be in format: Bearer <token>'
                }), 401

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Decode token
            data = jwt.decode(
                token,
                current_app.config['SECRET_KEY'],
                algorithms=["HS256"]
            )
            
            # Check token expiration
            exp = datetime.fromtimestamp(data['exp'])
            if datetime.utcnow() > exp:
                return jsonify({
                    'message': 'Token has expired',
                    'expires_at': exp.isoformat()
                }), 401
                
            # Get time until expiration
            time_left = exp - datetime.utcnow()
            
            # If token is about to expire (less than 5 minutes), include warning
            if time_left < timedelta(minutes=5):
                response = jsonify({
                    'warning': 'Token will expire soon',
                    'expires_in': str(time_left),
                    'expires_at': exp.isoformat()
                })
                response.headers['X-Token-Expiry-Warning'] = 'true'
                response.headers['X-Token-Expires-In'] = str(time_left)
                
            from models.user import User
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token - User not found'}), 401
                
            return f(current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return jsonify({
                'message': 'Token has expired',
                'error': 'Please login again to get a new token'
            }), 401
        except jwt.InvalidTokenError as e:
            return jsonify({
                'message': 'Invalid token',
                'error': str(e)
            }), 401

    return decorated

def refresh_token(current_token, expires_in_minutes=30):
    """
    Refresh a JWT token if it's still valid but about to expire
    """
    try:
        # Decode current token
        data = jwt.decode(
            current_token,
            current_app.config['SECRET_KEY'],
            algorithms=["HS256"]
        )
        
        # Generate new token with same user_id but new expiration
        return generate_token(data['user_id'], expires_in_minutes)
        
    except jwt.InvalidTokenError:
        return None 