from flask import Blueprint, request, jsonify, current_app
from models.upload import Upload
from models.user import User, db
from models.bill import Bill
from utils.auth import token_required
from utils.logger import get_logger
from config import MAX_TOTAL_UPLOADS, MAX_UPLOADS_PER_DAY, MAX_TOTAL_SIZE_PER_DAY, MAX_FILE_SIZE
from werkzeug.utils import secure_filename
import os
from utils.data_extraction import DataExtractor
from utils.ai_services import AIServices
from sqlalchemy.exc import IntegrityError
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from utils.cache_decorator import redis_cache


logger = get_logger(__name__)
upload_bp = Blueprint('upload', __name__, url_prefix='/api')

# Initialize data extractor and AI services
data_extractor = DataExtractor()
ai_services = AIServices()

# Use the limiter from the main app
limiter = Limiter(key_func=get_remote_address)

def check_upload_limits(user_id):
    """
    Check if user has exceeded upload limits
    Returns: (bool, str) - (is_allowed, error_message)
    """
    # Check total uploads
    total_uploads = Upload.get_user_total_uploads(user_id)
    if total_uploads >= MAX_TOTAL_UPLOADS:
        return False, f"Total upload limit of {MAX_TOTAL_UPLOADS} files reached"
    
    # Check daily uploads
    daily_uploads = Upload.get_user_upload_count(user_id)
    if daily_uploads >= MAX_UPLOADS_PER_DAY:
        return False, f"Daily upload limit of {MAX_UPLOADS_PER_DAY} files reached"
    
    # Check total size
    total_size = Upload.get_user_total_size(user_id)
    if total_size >= MAX_TOTAL_SIZE_PER_DAY:
        return False, f"Daily storage limit of {MAX_TOTAL_SIZE_PER_DAY/1024/1024}MB reached"
    
    return True, None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS'].split(',')

@upload_bp.route('/upload', methods=['POST'])
@token_required
@limiter.limit("10/day")
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
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)

            logger.info(f"File saved temporarily for user {current_user.id}: {filename}")

            try:
                data_extractor = DataExtractor()
                # Extract data from the image
                result = data_extractor.extract_text_from_file(file_path)
                # Upload the image to S3 after extraction
                # data_extractor.upload_image_to_s3(
                #     file_path,
                #     bucket_name=S3_BUCKET_NAME,
                #     user_id=current_user.id,
                #     content_type=file.content_type
                # )
                # logger.info(f"Image uploaded to S3 for user {current_user.id}: {filename}")
                # Save the extracted data to database
                try:
                    bill = User.save_extracted_data(db, current_user.id, result['analysis'])
                except IntegrityError as ie:
                    db.session.rollback()
                    logger.error(f"Duplicate bill detected for user {current_user.id}: {str(ie)}")
                    return jsonify({'message': 'Duplicate bill not allowed. This bill already exists. Please upload a different bill.'}), 409
                logger.info(f"Extracted data saved to DB for user {current_user.id}, bill id: {bill.id}")
                # Upload the image to S3 with username_billid as key
                user_obj = User.query.get(current_user.id)
                s3_upload_success = DataExtractor.upload_image_to_s3(
                    file_path,
                    bucket_name=os.environ.get('S3_BUCKET_NAME', 'spendlytic'),
                    user_id=user_obj.username + f'_{bill.id}',
                    content_type=file.content_type,
                    folder="uploads"
                )
                if s3_upload_success is None:
                    logger.error(f"Failed to upload image to S3 for user {current_user.id}, bill id: {bill.id}")
                    return jsonify({'message': 'Failed to upload image to S3.'}), 500
                bill.s3_key = s3_upload_success
                db.session.commit()
                # Invalidate bills cache for this user
                cache_key = f"user_bills_{current_user.id}"
                current_app.redis_client.delete(cache_key)
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

# New endpoint to get signed S3 URL for bill preview
@upload_bp.route('/bill/<int:bill_id>/preview-url', methods=['GET'])
@token_required
@redis_cache(lambda current_user, bill_id: f"signed_url_{current_user.id}_{bill_id}", timeout=600)
def get_bill_preview_url(current_user, bill_id):
    bill = Bill.get_bill(bill_id)
    if not bill or bill.user_id != current_user.id:
        return {'message': 'Bill not found or unauthorized'}, 404
    if not bill.s3_key:
        return {'message': 'No image available for this bill'}, 404
    bucket_name = os.environ.get('S3_BUCKET_NAME', 'spendlytic')
    expiration = 600
    signed_url = DataExtractor.generate_presigned_url(bucket_name, bill.s3_key, expiration=expiration)
    if not signed_url:
        return {'message': 'Failed to generate signed URL'}, 500
    return {'signed_url': signed_url}, 200 