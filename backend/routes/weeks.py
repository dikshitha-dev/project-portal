from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from models.week import Week
from middleware.auth import token_required, admin_required
from extensions import db

weeks_bp = Blueprint("weeks", __name__)


def ensure_default_week_for_project(project_id):
    """
    If a project has no milestone weeks yet, create a default one so candidates
    can still submit GitHub / deployed URL / objectives / screenshots.
    Does not change existing weeks.
    """
    existing = (
        Week.query.filter_by(project_id=project_id)
        .order_by(Week.deadline.asc())
        .all()
    )
    if existing:
        return existing

    week = Week(
        week_title="Project Submission",
        objective="Submit your GitHub repository, deployed website, project objectives, and screenshots for mentor review.",
        resources=None,
        deadline=date.today() + timedelta(days=30),
        project_id=project_id,
    )
    db.session.add(week)
    db.session.commit()
    return [week]


@weeks_bp.route("/", methods=["GET"])
@token_required
def get_weeks(current_user):
    from models.project import ProjectMember
    project_id = request.args.get("project_id")
    if project_id:
        if current_user.role != "admin":
            is_member = ProjectMember.query.filter_by(project_id=project_id, user_id=current_user.id).first()
            if not is_member:
                return jsonify({"error": "Access denied to this project"}), 403
        weeks = ensure_default_week_for_project(project_id)
    else:
        if current_user.role != "admin":
            member_records = ProjectMember.query.filter_by(user_id=current_user.id).all()
            project_ids = [m.project_id for m in member_records]
            weeks = Week.query.filter(Week.project_id.in_(project_ids)).order_by(Week.deadline.asc()).all()
        else:
            weeks = Week.query.order_by(Week.deadline.asc()).all()
    return jsonify({"weeks": [w.to_dict() for w in weeks]}), 200


@weeks_bp.route("/<week_id>", methods=["GET"])
@token_required
def get_week(current_user, week_id):
    week = Week.query.filter_by(id=week_id).first()
    if not week:
        return jsonify({"error": "Week not found"}), 404
    return jsonify({"week": week.to_dict()}), 200


@weeks_bp.route("/", methods=["POST"])
@admin_required
def create_week(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    week_title = data.get("week_title")
    objective = data.get("objective")
    resources = data.get("resources")
    deadline = data.get("deadline")
    project_id = data.get("project_id")

    if not week_title or not objective or not deadline:
        return jsonify({"error": "Week title, objective, and deadline are required"}), 400

    week = Week(
        week_title=week_title,
        objective=objective,
        resources=resources,
        deadline=datetime.strptime(deadline, "%Y-%m-%d").date(),
        project_id=project_id if project_id else None,
    )
    db.session.add(week)
    db.session.commit()

    return jsonify({"message": "Week created successfully", "week": week.to_dict()}), 201


@weeks_bp.route("/<week_id>", methods=["PUT"])
@admin_required
def update_week(current_user, week_id):
    week = Week.query.filter_by(id=week_id).first()
    if not week:
        return jsonify({"error": "Week not found"}), 404

    data = request.get_json()
    if data.get("week_title"):
        week.week_title = data["week_title"]
    if data.get("objective"):
        week.objective = data["objective"]
    if data.get("resources") is not None:
        week.resources = data["resources"]
    if data.get("deadline"):
        week.deadline = datetime.strptime(data["deadline"], "%Y-%m-%d").date()
    if "project_id" in data:
        week.project_id = data["project_id"]

    db.session.commit()
    return jsonify({"message": "Week updated successfully", "week": week.to_dict()}), 200


@weeks_bp.route("/<week_id>", methods=["DELETE"])
@admin_required
def delete_week(current_user, week_id):
    week = Week.query.filter_by(id=week_id).first()
    if not week:
        return jsonify({"error": "Week not found"}), 404

    db.session.delete(week)
    db.session.commit()
    return jsonify({"message": "Week deleted successfully"}), 200
