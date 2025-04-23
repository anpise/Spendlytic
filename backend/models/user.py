from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from typing import List, Dict, Any
from . import db
from models.bill import Bill
from models.item import Item

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    bills = db.relationship('Bill', backref='user', lazy=True, cascade="all, delete-orphan")

    def __init__(self, username, email, password):
        self.username = username
        self.email = email
        self.set_password(password)

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def save_extracted_data(db, user_id: int, financial_data: Dict[str, Any]) -> 'Bill':
        """
        Save extracted financial data to the database
        """
        try:
            # Convert date string to datetime
            date = datetime.strptime(financial_data['date'], '%Y-%m-%d')
            
            # Create bill
            bill = Bill(
                merchant_name=financial_data['merchant_name'],
                total_amount=financial_data['total_amount'],
                date=date,
                user_id=user_id
            )
            db.session.add(bill)
            db.session.flush()  # Get the bill ID
            
            # Create items
            for item_data in financial_data['items']:
                item = Item(
                    description=item_data['name'],
                    quantity=item_data['quantity'],
                    price=item_data['price'],
                    bill_id=bill.id
                )
                db.session.add(item)
            
            db.session.commit()
            db.session.refresh(bill)
            
            return bill
            
        except Exception as e:
            db.session.rollback()
            raise e 