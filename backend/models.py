from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class CheckedURL(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(2048), unique=True, nullable=False, index=True)
    is_safe = db.Column(db.Boolean, nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    reasons = db.Column(db.JSON, nullable=False)
    last_checked = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "url": self.url,
            "is_safe": self.is_safe,
            "risk_score": self.risk_score,
            "reasons": self.reasons,
            "cached": True
        }

class UserReport(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(2048), nullable=False, index=True)
    reported_is_safe = db.Column(db.Boolean, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "url": self.url,
            "reported_is_safe": self.reported_is_safe,
            "timestamp": self.timestamp.isoformat()
        }
