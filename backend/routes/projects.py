from flask import Blueprint, request, jsonify
from datetime import datetime
import secrets
from models.project import Project, ProjectMember, ProjectJoinRequest
from models.notification import Notification
from models.user import User
from models.week import Week
from middleware.auth import token_required, admin_required
from extensions import db

projects_bp = Blueprint("projects", __name__)


def is_project_owner(user, project):
    return user.role == "admin" and (project.owner_id == user.id or user.email == "admin@portal.com")


def has_project_access(user, project):
    if is_project_owner(user, project):
        return True
    member = ProjectMember.query.filter_by(project_id=project.id, user_id=user.id).first()
    return member is not None


@projects_bp.route("/", methods=["GET"])
@token_required
def get_projects(current_user):
    search = request.args.get("search", "").strip().lower()

    if current_user.role == "admin":
        # Admin can view all projects
        projects = Project.query.order_by(Project.created_at.desc()).all()
    else:
        # Candidate/Member views:
        # 1. Projects where they are an approved member
        # 2. Projects where they have submitted a join request (pending or reviewed)
        member_records = ProjectMember.query.filter_by(user_id=current_user.id).all()
        member_project_ids = [m.project_id for m in member_records]

        req_records = ProjectJoinRequest.query.filter_by(user_id=current_user.id).all()
        req_project_ids = [r.project_id for r in req_records]

        all_project_ids = list(set(member_project_ids + req_project_ids))
        if all_project_ids:
            projects = Project.query.filter(Project.id.in_(all_project_ids)).order_by(Project.created_at.desc()).all()
        else:
            projects = []

    if search:
        projects = [p for p in projects if search in p.name.lower() or (p.description and search in p.description.lower())]

    return jsonify({"projects": [p.to_dict(user_id=current_user.id) for p in projects]}), 200


@projects_bp.route("/discover", methods=["GET"])
@token_required
def get_discover_projects(current_user):
    """Returns public projects for candidates to discover and join."""
    search = request.args.get("search", "").strip().lower()

    # Public projects
    projects = Project.query.filter_by(public_joining=True).order_by(Project.created_at.desc()).all()

    if search:
        projects = [p for p in projects if search in p.name.lower() or (p.description and search in p.description.lower())]

    return jsonify({"projects": [p.to_dict(user_id=current_user.id) for p in projects]}), 200


@projects_bp.route("/my-requests", methods=["GET"])
@token_required
def get_my_requests(current_user):
    """Returns all join requests submitted by current user."""
    reqs = ProjectJoinRequest.query.filter_by(user_id=current_user.id).order_by(ProjectJoinRequest.created_at.desc()).all()
    return jsonify({"requests": [r.to_dict() for r in reqs]}), 200



@projects_bp.route("/", methods=["POST"])
@token_required
def create_project(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    public_joining = bool(data.get("public_joining", False))

    if not name:
        return jsonify({"error": "Project name is required"}), 400

    project = Project(
        name=name,
        description=description,
        owner_id=current_user.id,
        public_joining=public_joining,
        invite_code=secrets.token_hex(4).upper(),
        status="Active",
    )
    db.session.add(project)
    db.session.flush()

    # Automatically add creator as owner member
    owner_member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role="owner",
    )
    db.session.add(owner_member)
    db.session.commit()

    return jsonify({
        "message": "Project created successfully",
        "project": project.to_dict(include_details=True),
    }), 201


@projects_bp.route("/<project_id>", methods=["GET"])
@token_required
def get_project(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not has_project_access(current_user, project):
        join_req = ProjectJoinRequest.query.filter_by(project_id=project.id, user_id=current_user.id).first()
        if join_req and join_req.status == "pending":
            return jsonify({
                "error": "Your request to join this project is pending approval from the project owner.",
                "status": "pending",
                "project_name": project.name,
            }), 403
        elif join_req and join_req.status == "rejected":
            return jsonify({
                "error": "Your request to join this project was rejected by the project owner.",
                "status": "rejected",
            }), 403
        return jsonify({
            "error": "Access denied. You are not an approved member of this project.",
            "status": "not_member",
        }), 403

    return jsonify({"project": project.to_dict(include_details=True, user_id=current_user.id)}), 200


@projects_bp.route("/<project_id>", methods=["PUT"])
@token_required
def update_project(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can edit project settings"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if data.get("name"):
        project.name = data["name"].strip()
    if "description" in data:
        project.description = data["description"].strip()
    if "public_joining" in data:
        project.public_joining = bool(data["public_joining"])
    if data.get("status"):
        project.status = data["status"]

    db.session.commit()
    return jsonify({
        "message": "Project updated successfully",
        "project": project.to_dict(include_details=True),
    }), 200


@projects_bp.route("/<project_id>", methods=["DELETE"])
@token_required
def delete_project(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can delete this project"}), 403

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted successfully"}), 200


@projects_bp.route("/<project_id>/regenerate-code", methods=["POST"])
@token_required
def regenerate_invite_code(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can regenerate invite codes"}), 403

    project.invite_code = secrets.token_hex(4).upper()
    db.session.commit()

    return jsonify({
        "message": "Invite code regenerated",
        "invite_code": project.invite_code,
    }), 200


@projects_bp.route("/join-request", methods=["POST"])
@token_required
def submit_join_request(current_user):
    data = request.get_json()
    if not data or not data.get("invite_code"):
        return jsonify({"error": "Invite code is required"}), 400

    code = data["invite_code"].strip().upper()
    project = Project.query.filter_by(invite_code=code).first()
    if not project:
        return jsonify({"error": "Invite code not found."}), 404

    # Check if already a member
    existing_member = ProjectMember.query.filter_by(project_id=project.id, user_id=current_user.id).first()
    if existing_member:
        return jsonify({"error": "You are already a member."}), 400

    # Check existing join request
    existing_req = ProjectJoinRequest.query.filter_by(project_id=project.id, user_id=current_user.id).first()
    if existing_req:
        if existing_req.status == "pending":
            return jsonify({"error": "Join request already pending.", "status": "pending"}), 400
        elif existing_req.status in ["accepted", "approved"]:
            return jsonify({"error": "You are already a member."}), 400
        else:
            # Resubmit if previously rejected or cancelled
            existing_req.status = "pending"
            existing_req.feedback = None
            existing_req.created_at = datetime.utcnow()
            existing_req.reviewed_at = None
    else:
        existing_req = ProjectJoinRequest(
            project_id=project.id,
            user_id=current_user.id,
            status="pending",
        )
        db.session.add(existing_req)

    # Notify project owner
    owner_notif = Notification(
        user_id=project.owner_id,
        title="New Join Request",
        message=f"{current_user.name} requested to join {project.name}",
        type="join_request",
        link=f"/admin/projects/{project.id}",
    )
    db.session.add(owner_notif)
    db.session.commit()

    return jsonify({
        "message": "Join request submitted! Awaiting admin approval.",
        "project_name": project.name,
        "project_id": project.id,
        "status": "pending",
    }), 201


@projects_bp.route("/<project_id>/join", methods=["POST"])
@token_required
def join_public_project(current_user, project_id):
    """Allows candidates to request joining a public project directly."""
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found."}), 404
    if not project.public_joining:
        return jsonify({"error": "This project is private. Please enter an invite code to join."}), 400

    existing_member = ProjectMember.query.filter_by(project_id=project.id, user_id=current_user.id).first()
    if existing_member:
        return jsonify({"error": "You are already a member."}), 400

    existing_req = ProjectJoinRequest.query.filter_by(project_id=project.id, user_id=current_user.id).first()
    if existing_req:
        if existing_req.status == "pending":
            return jsonify({"error": "Join request already pending.", "status": "pending"}), 400
        elif existing_req.status in ["accepted", "approved"]:
            return jsonify({"error": "You are already a member."}), 400
        else:
            existing_req.status = "pending"
            existing_req.feedback = None
            existing_req.created_at = datetime.utcnow()
            existing_req.reviewed_at = None
    else:
        existing_req = ProjectJoinRequest(
            project_id=project.id,
            user_id=current_user.id,
            status="pending",
        )
        db.session.add(existing_req)

    owner_notif = Notification(
        user_id=project.owner_id,
        title="New Join Request",
        message=f"{current_user.name} requested to join {project.name}",
        type="join_request",
        link=f"/admin/projects/{project.id}",
    )
    db.session.add(owner_notif)
    db.session.commit()

    return jsonify({
        "message": "Join request submitted! Awaiting admin approval.",
        "project_name": project.name,
        "project_id": project.id,
        "status": "pending",
    }), 201


@projects_bp.route("/<project_id>/join-requests/cancel", methods=["POST"])
@token_required
def cancel_join_request(current_user, project_id):
    """Allows candidate to withdraw a pending join request."""
    req_record = ProjectJoinRequest.query.filter_by(project_id=project_id, user_id=current_user.id, status="pending").first()
    if not req_record:
        return jsonify({"error": "No pending join request found."}), 404

    req_record.status = "cancelled"
    req_record.reviewed_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Join request withdrawn successfully.", "status": "cancelled"}), 200


@projects_bp.route("/<project_id>/join-requests/<request_id>/accept", methods=["POST"])
@projects_bp.route("/<project_id>/join-requests/<request_id>/approve", methods=["POST"])
@token_required
def accept_join_request(current_user, project_id, request_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can approve join requests"}), 403

    req_record = ProjectJoinRequest.query.filter_by(id=request_id, project_id=project_id).first()
    if not req_record:
        return jsonify({"error": "Join request not found"}), 404

    req_record.status = "approved"
    req_record.reviewed_at = datetime.utcnow()

    # Add as member if not already added
    if not ProjectMember.query.filter_by(project_id=project_id, user_id=req_record.user_id).first():
        member = ProjectMember(
            project_id=project_id,
            user_id=req_record.user_id,
            role="member",
        )
        db.session.add(member)

    # Notify candidate
    cand_notif = Notification(
        user_id=req_record.user_id,
        title="Join Request Approved 🎉",
        message=f"You have been approved as a member of {project.name}!",
        type="join_approved",
        link=f"/projects/{project.id}",
    )
    db.session.add(cand_notif)
    db.session.commit()

    return jsonify({"message": "Join request approved successfully", "status": "approved"}), 200


@projects_bp.route("/<project_id>/join-requests/<request_id>/reject", methods=["POST"])
@token_required
def reject_join_request(current_user, project_id, request_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can reject join requests"}), 403

    req_record = ProjectJoinRequest.query.filter_by(id=request_id, project_id=project_id).first()
    if not req_record:
        return jsonify({"error": "Join request not found"}), 404

    data = request.get_json() or {}
    feedback = data.get("feedback", "").strip()

    req_record.status = "rejected"
    req_record.feedback = feedback if feedback else None
    req_record.reviewed_at = datetime.utcnow()

    # Notify candidate
    msg = f"Your request to join {project.name} was rejected."
    if feedback:
        msg += f" Reason: {feedback}"

    cand_notif = Notification(
        user_id=req_record.user_id,
        title="Join Request Update",
        message=msg,
        type="join_rejected",
        link="/dashboard",
    )
    db.session.add(cand_notif)
    db.session.commit()

    return jsonify({"message": "Join request rejected", "status": "rejected"}), 200


@projects_bp.route("/<project_id>/members", methods=["POST"])
@token_required
def add_project_member(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can add members directly"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    identifier = (data.get("email") or data.get("username") or data.get("user_id") or "").strip()
    if not identifier:
        return jsonify({"error": "User email or username is required"}), 400

    user = User.query.filter(
        (User.email.ilike(identifier)) | (User.name.ilike(identifier)) | (User.id == identifier)
    ).first()
    if not user:
        return jsonify({"error": f"User '{identifier}' not found"}), 404

    existing = ProjectMember.query.filter_by(project_id=project_id, user_id=user.id).first()
    if existing:
        return jsonify({"error": f"{user.name} is already a member of this project"}), 409

    role = data.get("role", "member")
    member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=role,
    )
    db.session.add(member)

    # If user had a pending join request, mark it accepted
    pending_req = ProjectJoinRequest.query.filter_by(project_id=project_id, user_id=user.id, status="pending").first()
    if pending_req:
        pending_req.status = "accepted"

    db.session.commit()
    return jsonify({
        "message": f"{user.name} added to project",
        "member": member.to_dict(),
    }), 201


@projects_bp.route("/<project_id>/members/<member_id>", methods=["DELETE"])
@token_required
def remove_project_member(current_user, project_id, member_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not is_project_owner(current_user, project):
        return jsonify({"error": "Only the project owner can remove members"}), 403

    member = ProjectMember.query.filter_by(id=member_id, project_id=project_id).first()
    if not member:
        return jsonify({"error": "Member not found"}), 404

    if member.user_id == project.owner_id:
        return jsonify({"error": "The project owner cannot be removed"}), 400

    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member removed from project"}), 200


@projects_bp.route("/<project_id>/weeks", methods=["GET"])
@token_required
def get_project_weeks(current_user, project_id):
    project = Project.query.filter_by(id=project_id).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    if not has_project_access(current_user, project):
        return jsonify({"error": "Access denied"}), 403

    from routes.weeks import ensure_default_week_for_project
    weeks = ensure_default_week_for_project(project_id)
    return jsonify({"weeks": [w.to_dict() for w in weeks]}), 200
