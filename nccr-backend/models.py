from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "cultivator", "company", "admin"
    wallet_address = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    plantation_requests = db.relationship('PlantationRequest', backref='user', lazy=True)
    carbon_credits = db.relationship('CarbonCredit', backref='user', lazy=True)
    sent_transactions = db.relationship('Transaction', foreign_keys='Transaction.from_user', backref='sender', lazy=True)
    received_transactions = db.relationship('Transaction', foreign_keys='Transaction.to_user', backref='receiver', lazy=True)

class PlantationRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    photo_path = db.Column(db.String(200), nullable=False)
    plant_type = db.Column(db.String(50), nullable=True)
    co2_removed = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending')  # "pending", "approved", "rejected"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    carbon_credit = db.relationship('CarbonCredit', backref='plantation_request', uselist=False)

class CarbonCredit(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    plantation_request_id = db.Column(db.Integer, db.ForeignKey('plantation_request.id'), nullable=True)
    credits = db.Column(db.Float, nullable=False)
    price_per_credit = db.Column(db.Float, nullable=False, default=100.0)  # Price in rupees per credit
    nft_metadata = db.Column(db.String(500), nullable=True)  # JSON string
    tx_hash = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_user = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # None for minting
    to_user = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    credits = db.Column(db.Float, nullable=False)
    tx_hash = db.Column(db.String(100), unique=True, nullable=False)
    block_number = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)




