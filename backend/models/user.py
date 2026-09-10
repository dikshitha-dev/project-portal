from extensions import db
from datetime import datetime
import uuid


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    profile_image = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    submissions = db.relationship("Submission", backref="user", lazy=True, cascade="all, delete-orphan")

    def __init__(self, name=None, email=None, password=None, role=None, profile_image=None, **kwargs):
        super().__init__(**kwargs)
        self.name = name
        self.email = email
        self.password = password
        self.role = role
        self.profile_image = profile_image

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "profile_image": self.profile_image,
            "profileImage": self.profile_image,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
