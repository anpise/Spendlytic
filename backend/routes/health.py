from flask import Blueprint, jsonify
from utils.logger import get_logger

logger = get_logger(__name__)
health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health():
    try:
        logger.info("Health check (root)")
        return jsonify({'status': 'ok'}), 200
    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        return jsonify({'status': 'error', 'error': str(e)}), 500
