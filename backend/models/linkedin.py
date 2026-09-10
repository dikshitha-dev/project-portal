from extensions import db
from datetime import datetime
import uuid


class PostSubmission(db.Model):
    __tablename__ = "post_submissions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    platform = db.Column(db.String(50), default="LinkedIn")
    caption = db.Column(db.Text, default="")
    status = db.Column(db.String(30), default="Draft")  # "Draft", "Pending Review", "Approved", "Needs Changes"
    posting_date = db.Column(db.String(50), nullable=True)
    posting_time = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref=db.backref("post_submissions", lazy=True, cascade="all, delete-orphan"))
    media = db.relationship("PostMedia", backref="submission", lazy=True, cascade="all, delete-orphan", order_by="PostMedia.created_at")
    reviews = db.relationship("PostReview", backref="submission", lazy=True, cascade="all, delete-orphan", order_by="PostReview.reviewed_at.desc()")
    activities = db.relationship("SubmissionActivity", backref="submission", lazy=True, cascade="all, delete-orphan", order_by="SubmissionActivity.created_at.asc()")

    def to_dict(self, include_details=True):
        latest_review = self.reviews[0] if self.reviews else None
        data = {
            "id": self.id,
            "userId": self.user_id,
            "user_id": self.user_id,
            "platform": self.platform or "LinkedIn",
            "caption": self.caption or "",
            "status": self.status or "Draft",
            "postingDate": self.posting_date,
            "postingTime": self.posting_time,
            "posting_date": self.posting_date,
            "posting_time": self.posting_time,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "user": self.user.to_dict() if self.user else None,
            "latest_review": latest_review.to_dict() if latest_review else None,
        }
        if include_details:
            data["media"] = [m.to_dict() for m in self.media]
            data["reviews"] = [r.to_dict() for r in self.reviews]
            data["activities"] = [a.to_dict() for a in self.activities]
        return data


class PostMedia(db.Model):
    __tablename__ = "post_media"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(36), db.ForeignKey("post_submissions.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    video_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "submissionId": self.submission_id,
            "submission_id": self.submission_id,
            "imageUrl": self.image_url,
            "image_url": self.image_url,
            "videoUrl": self.video_url,
            "video_url": self.video_url,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PostReview(db.Model):
    __tablename__ = "post_reviews"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(36), db.ForeignKey("post_submissions.id"), nullable=False)
    admin_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    feedback = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, default=datetime.utcnow)
    decision = db.Column(db.String(30), nullable=False)  # "Approved" or "Needs Changes"

    admin = db.relationship("User", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "submissionId": self.submission_id,
            "submission_id": self.submission_id,
            "adminId": self.admin_id,
            "admin_id": self.admin_id,
            "feedback": self.feedback,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "decision": self.decision,
            "admin": self.admin.to_dict() if self.admin else None,
        }


class SubmissionActivity(db.Model):
    __tablename__ = "submission_activities"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = db.Column(db.String(36), db.ForeignKey("post_submissions.id"), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # e.g. "Draft Created", "Submitted for Approval", "Mentor Reviewed", "Needs Changes", "Candidate Updated", "Approved"
    actor_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    actor_name = db.Column(db.String(255), nullable=True)
    details = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    actor = db.relationship("User", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "submission_id": self.submission_id,
            "action": self.action,
            "actor_id": self.actor_id,
            "actor_name": self.actor_name,
            "details": self.details,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
