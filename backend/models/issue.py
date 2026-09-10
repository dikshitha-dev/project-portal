from extensions import db
from datetime import datetime
import uuid


class Issue(db.Model):
    __tablename__ = "issues"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    annotation_id = db.Column(db.String(36), db.ForeignKey("annotations.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(20), default="To Do")
    reference_file_url = db.Column(db.String(500))
    mark_deduction = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __init__(
        self,
        annotation_id=None,
        title=None,
        description=None,
        priority="Medium",
        status="To Do",
        reference_file_url=None,
        mark_deduction=0,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.annotation_id = annotation_id
        self.title = title
        self.description = description
        self.priority = priority
        self.status = status
        self.reference_file_url = reference_file_url
        self.mark_deduction = mark_deduction

    def to_dict(self):
        return {
            "id": self.id,
            "annotation_id": self.annotation_id,
            "title": self.title,
            "description": self.description,
            "priority": self.priority,
            "status": self.status,
            "reference_file_url": self.reference_file_url,
            "mark_deduction": self.mark_deduction,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
