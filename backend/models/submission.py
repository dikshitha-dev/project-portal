from extensions import db
from datetime import datetime
import uuid


class Submission(db.Model):
    __tablename__ = "submissions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    week_id = db.Column(db.String(36), db.ForeignKey("weeks.id"), nullable=False)
    github_url = db.Column(db.String(500))
    deployed_url = db.Column(db.String(500))
    linkedin_url = db.Column(db.String(500))
    reflection = db.Column(db.Text)
    project_description = db.Column(db.Text)
    what_learned = db.Column(db.Text)
    difficulties_faced = db.Column(db.Text)
    status = db.Column(db.String(50), default="Submitted")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    review_files = db.relationship("ReviewFile", backref="submission", lazy=True, cascade="all, delete-orphan")
    grade = db.relationship("Grade", backref="submission", uselist=False, lazy=True, cascade="all, delete-orphan")

    __table_args__ = (db.UniqueConstraint("user_id", "week_id"),)

    def __init__(
        self,
        user_id=None,
        week_id=None,
        github_url=None,
        deployed_url=None,
        linkedin_url=None,
        reflection=None,
        project_description=None,
        what_learned=None,
        difficulties_faced=None,
        status="Submitted",
        **kwargs
    ):
        super().__init__(**kwargs)
        self.user_id = user_id
        self.week_id = week_id
        self.github_url = github_url
        self.deployed_url = deployed_url
        self.linkedin_url = linkedin_url
        self.reflection = reflection
        self.project_description = project_description
        self.what_learned = what_learned
        self.difficulties_faced = difficulties_faced
        self.status = status or "Submitted"

    def to_dict(self):
        desc = self.project_description or self.reflection or ""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "week_id": self.week_id,
            "project_id": self.week.project_id if self.week else None,
            "github_url": self.github_url,
            "deployed_url": self.deployed_url,
            "linkedin_url": self.linkedin_url,
            "reflection": self.reflection,
            "project_description": desc,
            "what_learned": self.what_learned or "",
            "difficulties_faced": self.difficulties_faced or "",
            "status": self.status or "Submitted",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": self.user.to_dict() if self.user else None,
            "week": self.week.to_dict() if self.week else None,
            "review_files": [f.to_dict() for f in self.review_files] if self.review_files else [],
            "grade": self.grade.to_dict() if self.grade else None,
        }


class ReviewFile(db.Model):
    __tablename__ = "review_files"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(36), db.ForeignKey("submissions.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    file_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    annotations = db.relationship("Annotation", backref="image", lazy=True, cascade="all, delete-orphan")

    def __init__(
        self,
        submission_id=None,
        image_url=None,
        file_name=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.submission_id = submission_id
        self.image_url = image_url
        self.file_name = file_name

    def to_dict(self):
        return {
            "id": self.id,
            "submission_id": self.submission_id,
            "image_url": self.image_url,
            "file_name": self.file_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "annotations": [a.to_dict() for a in self.annotations] if self.annotations else [],
        }


class Annotation(db.Model):
    __tablename__ = "annotations"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    image_id = db.Column(db.String(36), db.ForeignKey("review_files.id"), nullable=False)
    tool_type = db.Column(db.String(50), nullable=False)
    coordinates = db.Column(db.JSON, nullable=False)
    color = db.Column(db.String(20), default="#7C3AED")
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    issue = db.relationship("Issue", backref="annotation", uselist=False, lazy=True, cascade="all, delete-orphan")

    def __init__(
        self,
        image_id=None,
        tool_type=None,
        coordinates=None,
        color="#7C3AED",
        text=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.image_id = image_id
        self.tool_type = tool_type
        self.coordinates = coordinates
        self.color = color
        self.text = text

    def to_dict(self):
        return {
            "id": self.id,
            "image_id": self.image_id,
            "tool_type": self.tool_type,
            "coordinates": self.coordinates,
            "color": self.color,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "issue": self.issue.to_dict() if self.issue else None,
        }
