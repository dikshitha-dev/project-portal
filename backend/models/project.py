from extensions import db
from datetime import datetime
import uuid
import secrets


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    owner_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    public_joining = db.Column(db.Boolean, default=False)
    invite_code = db.Column(db.String(32), unique=True, default=lambda: secrets.token_hex(4).upper())
    status = db.Column(db.String(20), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = db.relationship("User", foreign_keys=[owner_id], lazy=True)
    members = db.relationship("ProjectMember", backref="project", lazy=True, cascade="all, delete-orphan")
    join_requests = db.relationship("ProjectJoinRequest", backref="project", lazy=True, cascade="all, delete-orphan")
    weeks = db.relationship("Week", backref="project", lazy=True, cascade="all, delete-orphan")

    def __init__(
        self,
        name=None,
        description=None,
        owner_id=None,
        public_joining=False,
        invite_code=None,
        status="Active",
        **kwargs
    ):
        super().__init__(**kwargs)
        self.name = name
        self.description = description
        self.owner_id = owner_id
        self.public_joining = public_joining
        if invite_code is not None:
            self.invite_code = invite_code
        self.status = status

    def to_dict(self, include_details=False, user_id=None):
        sorted_weeks = sorted(self.weeks, key=lambda x: x.deadline or datetime.max.date())

        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "owner_id": self.owner_id,
            "owner_name": self.owner.name if self.owner else "Admin",
            "owner_email": self.owner.email if self.owner else None,
            "owner": self.owner.to_dict() if self.owner else None,
            "public_joining": bool(self.public_joining),
            "invite_code": self.invite_code,
            "status": self.status,
            "members_count": len(self.members),
            "total_members": len(self.members),
            "total_weeks": 0,
            "current_week": "",
            "progress_percent": 0,
            "submitted_weeks": 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if user_id:
            # Check membership status for user
            is_mem = any(m.user_id == user_id for m in self.members)
            if is_mem:
                data["membership_status"] = "approved"
            else:
                user_req = next((r for r in self.join_requests if r.user_id == user_id), None)
                if user_req:
                    data["membership_status"] = user_req.status
                    data["user_join_request"] = user_req.to_dict()
                else:
                    data["membership_status"] = "none"

        if include_details:
            data["members"] = [m.to_dict() for m in self.members]
            data["join_requests"] = [r.to_dict() for r in self.join_requests if r.status == "pending"]
            data["weeks"] = [w.to_dict() for w in sorted_weeks]
        return data


class ProjectMember(db.Model):
    __tablename__ = "project_members"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), default="member")  # "owner" or "member"
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", lazy=True)

    __table_args__ = (db.UniqueConstraint("project_id", "user_id"),)

    def __init__(
        self,
        project_id=None,
        user_id=None,
        role="member",
        **kwargs
    ):
        super().__init__(**kwargs)
        self.project_id = project_id
        self.user_id = user_id
        self.role = role

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_id": self.user_id,
            "role": self.role,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "user": self.user.to_dict() if self.user else None,
        }


class ProjectJoinRequest(db.Model):
    __tablename__ = "project_join_requests"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # "pending", "approved", "rejected", "cancelled"
    feedback = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", lazy=True)

    __table_args__ = (db.UniqueConstraint("project_id", "user_id"),)

    def __init__(
        self,
        project_id=None,
        user_id=None,
        status="pending",
        feedback=None,
        reviewed_at=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.project_id = project_id
        self.user_id = user_id
        self.status = status
        self.feedback = feedback
        self.reviewed_at = reviewed_at

    def to_dict(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "project_name": self.project.name if self.project else None,
            "user_id": self.user_id,
            "status": self.status,
            "feedback": self.feedback,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user": self.user.to_dict() if self.user else None,
        }
