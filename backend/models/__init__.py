from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Import all models
from .user import User
from .bill import Bill
from .item import Item

# Define relationships after all models are imported
User.bills = db.relationship("Bill", back_populates="user", cascade="all, delete-orphan")
Bill.user = db.relationship("User", back_populates="bills")
Bill.items = db.relationship("Item", back_populates="bill", cascade="all, delete-orphan")
Item.bill = db.relationship("Bill", back_populates="items") 