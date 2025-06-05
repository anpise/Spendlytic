from flask import Blueprint, jsonify
from models.bill import Bill
from models.item import Item
from utils.auth import token_required
from utils.logger import get_logger

logger = get_logger(__name__)
bills_bp = Blueprint('bills', __name__, url_prefix='/api')

@bills_bp.route('/bills', methods=['GET'])
@token_required
def get_user_bills(current_user):
    try:
        bills = Bill.get_user_bills(db=Bill.__table__.metadata.bind, user_id=current_user.id)
        logger.info(f"Fetched bills for user {current_user.id}")
        return jsonify({'bills': [bill.to_dict() for bill in bills]}), 200
    except Exception as e:
        logger.error(f"Error fetching bills for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

@bills_bp.route('/bills/<int:bill_id>/items', methods=['GET'])
@token_required
def get_bill_items(current_user, bill_id):
    try:
        bill = Bill.get_bill(db=Bill.__table__.metadata.bind, bill_id=bill_id)
        if not bill or bill.user_id != current_user.id:
            logger.info(f"Bill not found or unauthorized for user {current_user.id}, bill_id {bill_id}")
            return jsonify({'message': 'Bill not found'}), 404
        items = bill.items
        logger.info(f"Fetched items for bill {bill_id} (user {current_user.id})")
        return jsonify({'items': [item.to_dict() for item in items]}), 200
    except Exception as e:
        logger.error(f"Error fetching items for bill {bill_id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500 