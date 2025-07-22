from datetime import datetime
from typing import List, Dict, Any
from . import db

class Bill(db.Model):
    __tablename__ = "bills"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    merchant_name = db.Column(db.String(255), nullable=False)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    date = db.Column(db.DateTime(timezone=True), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime(timezone=True), default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    s3_key = db.Column(db.String(512), nullable=True)
    
    # Relationships
    items = db.relationship('Item', backref='bill', lazy=True, cascade="all, delete-orphan")
    
    # Unique constraint for bill per user
    __table_args__ = (
        db.UniqueConstraint('merchant_name', 'date', 'total_amount', 'user_id', name='uix_bill_user'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'merchant_name': self.merchant_name,
            'total_amount': self.total_amount,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            's3_key': self.s3_key,
            'items': [item.to_dict() for item in self.items]
        }

    @staticmethod
    def create_bill(db, user_id: int, merchant_name: str, total_amount: float, date: datetime) -> 'Bill':
        """
        Create a new bill
        """
        bill = Bill(
            merchant_name=merchant_name,
            total_amount=total_amount,
            date=date,
            user_id=user_id
        )
        db.session.add(bill)
        db.session.commit()
        db.session.refresh(bill)
        return bill

    def get_bill(bill_id: int) -> 'Bill':
        """
        Get a bill by ID
        """
        return db.session.query(Bill).filter(Bill.id == bill_id).first()

    def get_user_bills(user_id: int) -> List['Bill']:
        """
        Get all bills for a user
        """
        return db.session.query(Bill).filter(Bill.user_id == user_id).all()

    @staticmethod
    def update_bill(db, bill_id: int, **kwargs) -> 'Bill':
        """
        Update a bill
        """
        bill = Bill.get_bill(bill_id)
        if bill:
            for key, value in kwargs.items():
                setattr(bill, key, value)
            db.session.commit()
            db.session.refresh(bill)
        return bill

    @staticmethod
    def delete_bill(db, bill_id: int) -> bool:
        """
        Delete a bill
        """
        bill = Bill.get_bill(bill_id)
        if bill:
            db.session.delete(bill)
            db.session.commit()
            return True
        return False 