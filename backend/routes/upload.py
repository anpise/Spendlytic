from flask import Blueprint, request, jsonify, current_app
from models.upload import Upload
from models.user import db
from utils.auth import token_required
from utils.logger import get_logger
from config import MAX_TOTAL_UPLOADS, MAX_UPLOADS_PER_DAY, MAX_TOTAL_SIZE_PER_DAY
from werkzeug.utils import secure_filename
import os

logger = get_logger(__name__)
upload_bp = Blueprint('upload', __name__, url_prefix='/api')

def check_upload_limits(user_id):
    total_uploads = Upload.get_user_total_uploads(db, user_id)
    if total_uploads >= MAX_TOTAL_UPLOADS:
        return False, f"Total upload limit of {MAX_TOTAL_UPLOADS} files reached"
    daily_uploads = Upload.get_user_upload_count(db, user_id)
    if daily_uploads >= MAX_UPLOADS_PER_DAY:
        return False, f"Daily upload limit of {MAX_UPLOADS_PER_DAY} files reached"
    total_size = Upload.get_user_total_size(db, user_id)
    if total_size >= MAX_TOTAL_SIZE_PER_DAY:
        return False, f"Daily storage limit of {MAX_TOTAL_SIZE_PER_DAY/1024/1024}MB reached"
    return True, None

def allowed_file(filename):
    allowed = current_app.config['ALLOWED_EXTENSIONS']
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed.split(',')

@upload_bp.route('/upload', methods=['POST'])
@token_required
def upload_file(current_user):
    try:
        logger.info(f"User {current_user.id} attempting to upload a file")
        if 'file' not in request.files:
            return jsonify({'message': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'message': 'No selected file'}), 400
        if not allowed_file(file.filename):
            return jsonify({'message': 'File type not allowed'}), 400
        is_allowed, error_message = check_upload_limits(current_user.id)
        if not is_allowed:
            return jsonify({'message': error_message}), 403
        filename = secure_filename(file.filename)
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        file_size = os.path.getsize(save_path)
        upload = Upload(user_id=current_user.id, filename=filename, file_size=file_size)
        db.session.add(upload)
        db.session.commit()
        logger.info(f"File {filename} uploaded successfully by user {current_user.id}")
        return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 201
    except Exception as e:
        logger.error(f"Upload error for user {current_user.id}: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500 