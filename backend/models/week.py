from extensions import db
from datetime import datetime
import uuid


class Week(db.Model):
    __tablename__ = "weeks"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    week_title = db.Column(db.String(255), nullable=False)
    objective = db.Column(db.Text, nullable=False)
    resources = db.Column(db.Text)
    deadline = db.Column(db.Date, nullable=False)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    submissions = db.relationship("Submission", backref="week", lazy=True, cascade="all, delete-orphan")

    def __init__(self, week_title=None, objective=None, resources=None, deadline=None, project_id=None, **kwargs):
        super().__init__(**kwargs)
        self.week_title = week_title
        self.objective = objective
        self.resources = resources
        self.deadline = deadline
        self.project_id = project_id

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "week_title": self.week_title,
            "objective": self.objective,
            "resources": self.resources,
            "deadline": self.deadline.isoformat() if self.deadline else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
