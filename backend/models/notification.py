from extensions import db
from datetime import datetime
import uuid


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default="info")  # "join_request", "join_approved", "join_rejected", "info"
    link = db.Column(db.String(255), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", lazy=True)

    def __init__(
        self,
        user_id=None,
        title=None,
        message=None,
        type="info",
        link=None,
        is_read=False,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.title = title
        self.message = message
        self.type = type
        self.link = link
        self.is_read = is_read

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "message": self.message,
            "type": self.type,
            "link": self.link,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
