from extensions import db
from datetime import datetime
import uuid


class Grade(db.Model):
    __tablename__ = "grades"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(36), db.ForeignKey("submissions.id"), nullable=False)
    ui = db.Column(db.Float, default=0)
    functionality = db.Column(db.Float, default=0)
    github = db.Column(db.Float, default=0)
    documentation = db.Column(db.Float, default=0)
    innovation = db.Column(db.Float, default=0)
    weekly_progress = db.Column(db.Float, default=0)
    total = db.Column(db.Float, default=0)
    grade = db.Column(db.String(10))
    published = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("submission_id"),)

    def __init__(
        self,
        submission_id=None,
        ui=0,
        functionality=0,
        github=0,
        documentation=0,
        innovation=0,
        weekly_progress=0,
        total=0,
        grade=None,
        published=False,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.submission_id = submission_id
        self.ui = ui
        self.functionality = functionality
        self.github = github
        self.documentation = documentation
        self.innovation = innovation
        self.weekly_progress = weekly_progress
        self.total = total
        self.grade = grade
        self.published = published

    def calculate_total(self):
        self.total = (
            self.ui
            + self.functionality
            + self.github
            + self.documentation
            + self.innovation
            + self.weekly_progress
        )
        if self.total >= 90:
            self.grade = "A+"
        elif self.total >= 80:
            self.grade = "A"
        elif self.total >= 70:
            self.grade = "B"
        elif self.total >= 60:
            self.grade = "C"
        else:
            self.grade = "Needs Improvement"
        return self.total

    def to_dict(self):
        return {
            "id": self.id,
            "submission_id": self.submission_id,
            "ui": self.ui,
            "functionality": self.functionality,
            "github": self.github,
            "documentation": self.documentation,
            "innovation": self.innovation,
            "weekly_progress": self.weekly_progress,
            "total": self.total,
            "grade": self.grade,
            "published": self.published,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
