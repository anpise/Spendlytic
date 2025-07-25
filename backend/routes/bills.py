from flask import Blueprint, jsonify, current_app
from models.bill import Bill
from models.item import Item
from models.user import db
from utils.auth import token_required
from utils.logger import get_logger
from utils.cache_decorator import redis_cache
import redis
import json
from config import REDIS_URL

logger = get_logger(__name__)
bills_bp = Blueprint('bills', __name__, url_prefix='/api')

# Create a Redis client
redis_client = redis.Redis.from_url(REDIS_URL)

@bills_bp.route('/bills', methods=['GET'])
@token_required
@redis_cache(lambda current_user: f"user_bills_{current_user.id}", timeout=120)
def get_user_bills(current_user):
    try:
        logger.info(f"Bills requested by user {current_user.id}")
        bills = Bill.get_user_bills(current_user.id)
        bills_data = [bill.to_dict() for bill in bills]
        logger.info(f"Bills retrieved successfully for user {current_user.id}, count: {len(bills_data)}")
        return jsonify({
            'message': 'Bills retrieved successfully',
            'bills': bills_data
        }), 200
        
    except Exception as e:
        logger.error(f"Bills retrieval error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@bills_bp.route('/bills/<int:bill_id>', methods=['DELETE'])
@token_required
def delete_bill(current_user, bill_id):
    try:
        logger.info(f"Bill deletion requested for bill_id {bill_id} by user {current_user.id}")
        
        # Get the bill and check if it exists
        bill = Bill.get_bill(bill_id)
        if not bill:
            logger.info(f"Bill not found: {bill_id} for user {current_user.id}")
            return jsonify({'message': 'Bill not found'}), 404
        
        # Check if the user owns this bill
        if bill.user_id != current_user.id:
            logger.info(f"Unauthorized bill deletion attempt: bill_id {bill_id} by user {current_user.id}")
            return jsonify({'message': 'Unauthorized access to bill'}), 403
        
        # Delete the bill
        success = Bill.delete_bill(db, bill_id)
        if success:
            # Clear cache for this user's bills
            try:
                cache_key = f"user_bills_{current_user.id}"
                redis_client.delete(cache_key)
                logger.info(f"Cache cleared for user {current_user.id}")
            except Exception as cache_error:
                logger.warning(f"Failed to clear cache for user {current_user.id}: {str(cache_error)}")
            
            logger.info(f"Bill {bill_id} deleted successfully by user {current_user.id}")
            return jsonify({'message': 'Bill deleted successfully'}), 200
        else:
            logger.error(f"Failed to delete bill {bill_id} for user {current_user.id}")
            return jsonify({'message': 'Failed to delete bill'}), 500
        
    except Exception as e:
        logger.error(f"Bill deletion error for bill_id {bill_id} by user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@bills_bp.route('/bills/<int:bill_id>/items', methods=['GET'])
@token_required
@redis_cache(lambda current_user, bill_id: f"bill_items_{current_user.id}_{bill_id}", timeout=120)
def get_bill_items(current_user, bill_id):
    try:
        logger.info(f"Bill items requested for bill_id {bill_id} by user {current_user.id}")
        bill = Bill.get_bill(bill_id)
        if not bill:
            logger.info(f"Bill not found: {bill_id} for user {current_user.id}")
            return jsonify({'message': 'Bill not found'}), 404
        if bill.user_id != current_user.id:
            logger.info(f"Unauthorized bill access attempt: bill_id {bill_id} by user {current_user.id}")
            return jsonify({'message': 'Unauthorized access to bill'}), 403
        items_data = [item.to_dict() for item in bill.items]
        logger.info(f"Items retrieved for bill_id {bill_id} by user {current_user.id}, count: {len(items_data)}")
        return jsonify({
            'message': 'Items retrieved successfully',
            'items': items_data
        }), 200
        
    except Exception as e:
        logger.error(f"Bill items retrieval error for bill_id {bill_id} by user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500 