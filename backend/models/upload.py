from datetime import datetime, timedelta
from . import db

class Upload(db.Model):
    __tablename__ = 'uploads'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    upload_date = db.Column(db.DateTime(timezone=True), default=db.func.current_timestamp())
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    status = db.Column(db.String(50), default='completed')  # completed, failed, processing
    
    # Relationships
    user = db.relationship('User', backref=db.backref('uploads', lazy=True))
    
    def __init__(self, user_id, filename, file_size):
        self.user_id = user_id
        self.filename = filename
        self.file_size = file_size
    
    @staticmethod
    def get_user_upload_count(user_id: int, time_window: int = 24) -> int:
        """
        Get the number of uploads for a user in the last time_window hours
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window)
        return db.session.query(Upload).filter(
            Upload.user_id == user_id,
            Upload.upload_date >= cutoff_time
        ).count()
    
    @staticmethod
    def get_user_total_uploads(user_id: int) -> int:
        """
        Get the total number of uploads for a user
        """
        return db.session.query(Upload).filter(
            Upload.user_id == user_id
        ).count()
    
    @staticmethod
    def get_user_total_size(user_id: int, time_window: int = 24) -> int:
        """
        Get the total size of uploads for a user in the last time_window hours
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window)
        result = db.session.query(db.func.sum(Upload.file_size)).filter(
            Upload.user_id == user_id,
            Upload.upload_date >= cutoff_time
        ).scalar()
        return result or 0 