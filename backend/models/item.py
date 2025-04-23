from typing import Dict, Any, List
from . import db

class Item(db.Model):
    __tablename__ = "items"
    
    id = db.Column(db.Integer, primary_key=True, index=True)
    description = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    bill_id = db.Column(db.Integer, db.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    
    # Unique constraint for items within a bill
    __table_args__ = (
        db.UniqueConstraint('description', 'bill_id', name='uix_item_bill'),
    )

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'quantity': self.quantity,
            'price': self.price,
            'bill_id': self.bill_id
        }

    @staticmethod
    def create_item(db, bill_id: int, description: str, quantity: float, price: float) -> 'Item':
        """
        Create a new item
        """
        item = Item(
            description=description,
            quantity=quantity,
            price=price,
            bill_id=bill_id
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def get_item(db, item_id: int) -> 'Item':
        """
        Get an item by ID
        """
        return db.query(Item).filter(Item.id == item_id).first()

    @staticmethod
    def get_bill_items(db, bill_id: int) -> List['Item']:
        """
        Get all items for a bill
        """
        return db.query(Item).filter(Item.bill_id == bill_id).all()

    @staticmethod
    def update_item(db, item_id: int, **kwargs) -> 'Item':
        """
        Update an item
        """
        item = Item.get_item(db, item_id)
        if item:
            for key, value in kwargs.items():
                setattr(item, key, value)
            db.commit()
            db.refresh(item)
        return item

    @staticmethod
    def delete_item(db, item_id: int) -> bool:
        """
        Delete an item
        """
        item = Item.get_item(db, item_id)
        if item:
            db.delete(item)
            db.commit()
            return True
        return False 