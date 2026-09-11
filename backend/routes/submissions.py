from flask import Blueprint, request, jsonify
from models.submission import Submission, ReviewFile
from models.week import Week
from middleware.auth import token_required, admin_required
from utils.upload import save_file, get_file_url
from utils.supabase import sync_submission_to_supabase
from extensions import db

submissions_bp = Blueprint("submissions", __name__)


def is_valid_url(url_str):
    if not url_str or not isinstance(url_str, str):
        return False
    u = url_str.strip().lower()
    return u.startswith("http://") or u.startswith("https://")


@submissions_bp.route("/", methods=["POST"])
@token_required
def create_submission(current_user):
    data = request.get_json(silent=True) or request.form
    github_url = (data.get("github_url") or "").strip()
    deployed_url = (data.get("deployed_url") or "").strip()
    linkedin_url = (data.get("linkedin_url") or "").strip() or None
    project_description = (data.get("project_description") or "").strip()
    what_learned = (data.get("what_learned") or "").strip()
    difficulties_faced = (data.get("difficulties_faced") or "").strip()
    reflection = (data.get("reflection") or "").strip()
    week_id = data.get("week_id")
    project_id = data.get("project_id")

    if not week_id:
        # Allow submit with only project_id by ensuring a default week exists
        if project_id:
            from routes.weeks import ensure_default_week_for_project
            default_weeks = ensure_default_week_for_project(project_id)
            week_id = default_weeks[0].id
        else:
            return jsonify({"error": "Week ID is required"}), 400

    if not github_url:
        return jsonify({"error": "GitHub repository URL is required"}), 400
    if not is_valid_url(github_url):
        return jsonify({"error": "Please enter a valid GitHub repository URL (https://...)"}), 400

    if not deployed_url:
        return jsonify({"error": "Deployed website URL is required"}), 400
    if not is_valid_url(deployed_url):
        return jsonify({"error": "Please enter a valid deployed project URL (https://...)"}), 400

    if linkedin_url and not is_valid_url(linkedin_url):
        return jsonify({"error": "Please enter a valid LinkedIn URL (https://...)"}), 400

    if not project_description and not reflection:
        return jsonify({"error": "Project objectives are required"}), 400
    if project_description and len(project_description) > 5000:
        return jsonify({"error": "Project objectives must be 5000 characters or fewer"}), 400

    week = Week.query.filter_by(id=week_id).first()
    if not week:
        return jsonify({"error": "Week not found"}), 404

    target_project_id = project_id or week.project_id
    if target_project_id and current_user.role != "admin":
        from models.project import ProjectMember
        is_member = ProjectMember.query.filter_by(project_id=target_project_id, user_id=current_user.id).first()
        if not is_member:
            return jsonify({"error": "You are not an approved member of this project"}), 403

    existing = Submission.query.filter_by(
        user_id=current_user.id, week_id=week_id
    ).first()
    if existing:
        return jsonify({"error": "You have already submitted for this week"}), 409

    # Compose reflection if separate sections were provided
    if not reflection:
        if project_description:
            reflection = f"Project Objectives:\n{project_description}"
        else:
            parts = []
            if what_learned:
                parts.append(f"What was learned:\n{what_learned}")
            if difficulties_faced:
                parts.append(f"Difficulties faced:\n{difficulties_faced}")
            reflection = "\n\n".join(parts)
    elif not project_description:
        project_description = reflection

    files = request.files.getlist("screenshots")
    valid_files = [f for f in files if f and f.filename]
    if not valid_files:
        return jsonify({"error": "Please upload at least one project screenshot"}), 400

    submission = Submission(
        user_id=current_user.id,
        week_id=week_id,
        github_url=github_url,
        deployed_url=deployed_url,
        linkedin_url=linkedin_url,
        reflection=reflection,
        project_description=project_description,
        what_learned=what_learned,
        difficulties_faced=difficulties_faced,
        status="Submitted",
    )
    db.session.add(submission)
    db.session.flush()

    for file in valid_files:
        filepath = save_file(file)
        if filepath:
            image_url = get_file_url(filepath)
            review_file = ReviewFile(
                submission_id=submission.id,
                image_url=image_url,
                file_name=file.filename,
            )
            db.session.add(review_file)

    db.session.commit()

    try:
        sync_submission_to_supabase(submission.to_dict())
    except Exception as sync_err:
        print(f"Supabase submission sync warning: {sync_err}")

    return jsonify({"message": "Project submitted successfully!", "submission": submission.to_dict()}), 201


@submissions_bp.route("/", methods=["GET"])
@token_required
def get_submissions(current_user):
    project_id = request.args.get("project_id")
    query = Submission.query.join(Week, Submission.week_id == Week.id)
    if current_user.role != "admin":
        query = query.filter(Submission.user_id == current_user.id)
    if project_id:
        query = query.filter(Week.project_id == project_id)
    submissions = query.order_by(Submission.created_at.desc()).all()
    return jsonify({"submissions": [s.to_dict() for s in submissions]}), 200


@submissions_bp.route("/<submission_id>", methods=["GET"])
@token_required
def get_submission(current_user, submission_id):
    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    if current_user.role != "admin" and submission.user_id != current_user.id:
        return jsonify({"error": "Access denied"}), 403
    return jsonify({"submission": submission.to_dict()}), 200


@submissions_bp.route("/<submission_id>", methods=["PUT"])
@token_required
def update_submission(current_user, submission_id):
    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    if submission.user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    data = request.form if request.form else (request.get_json(silent=True) or {})
    
    if "github_url" in data:
        gh = (data["github_url"] or "").strip()
        if gh and not is_valid_url(gh):
            return jsonify({"error": "Please enter a valid GitHub repository URL (https://...)"}), 400
        submission.github_url = gh

    if "deployed_url" in data:
        dep = (data["deployed_url"] or "").strip()
        if dep and not is_valid_url(dep):
            return jsonify({"error": "Please enter a valid deployed project URL (https://...)"}), 400
        submission.deployed_url = dep

    if "linkedin_url" in data:
        li = (data["linkedin_url"] or "").strip()
        if li and not is_valid_url(li):
            return jsonify({"error": "Please enter a valid LinkedIn URL (https://...)"}), 400
        submission.linkedin_url = li or None

    if "project_description" in data:
        desc = (data["project_description"] or "").strip()
        if not desc:
            return jsonify({"error": "Project objectives are required"}), 400
        if len(desc) > 5000:
            return jsonify({"error": "Project objectives must be 5000 characters or fewer"}), 400
        submission.project_description = desc
    if "what_learned" in data:
        submission.what_learned = (data["what_learned"] or "").strip()
    if "difficulties_faced" in data:
        submission.difficulties_faced = (data["difficulties_faced"] or "").strip()
    if "status" in data and current_user.role == "admin":
        submission.status = data["status"]

    # Re-compose reflection
    if submission.project_description:
        submission.reflection = f"Project Objectives:\n{submission.project_description}"
    elif "reflection" in data:
        submission.reflection = data["reflection"]

    # Process any new screenshots uploaded with the update
    files = request.files.getlist("screenshots")
    for file in files:
        if file.filename:
            filepath = save_file(file)
            if filepath:
                image_url = get_file_url(filepath)
                review_file = ReviewFile(
                    submission_id=submission.id,
                    image_url=image_url,
                    file_name=file.filename,
                )
                db.session.add(review_file)

    db.session.flush()

    # Candidates must keep at least one screenshot; admins can still update status on legacy rows
    if submission.user_id == current_user.id:
        screenshot_count = ReviewFile.query.filter_by(submission_id=submission.id).count()
        if screenshot_count == 0:
            db.session.rollback()
            return jsonify({"error": "Please upload at least one project screenshot"}), 400

    db.session.commit()

    try:
        sync_submission_to_supabase(submission.to_dict())
    except Exception as sync_err:
        print(f"Supabase submission update sync warning: {sync_err}")

    return jsonify({"message": "Submission updated successfully", "submission": submission.to_dict()}), 200


@submissions_bp.route("/<submission_id>/screenshots/<file_id>", methods=["DELETE"])
@token_required
def delete_screenshot(current_user, submission_id, file_id):
    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    if submission.user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    review_file = ReviewFile.query.filter_by(id=file_id, submission_id=submission_id).first()
    if not review_file:
        return jsonify({"error": "Screenshot file not found"}), 404

    db.session.delete(review_file)
    db.session.commit()
    return jsonify({"message": "Screenshot deleted successfully"}), 200


@submissions_bp.route("/<submission_id>/screenshots", methods=["POST"])
@token_required
def upload_screenshots(current_user, submission_id):
    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404
    if submission.user_id != current_user.id and current_user.role != "admin":
        return jsonify({"error": "Access denied"}), 403

    files = request.files.getlist("screenshots")
    uploaded = []
    for file in files:
        if file.filename:
            filepath = save_file(file)
            if filepath:
                image_url = get_file_url(filepath)
                review_file = ReviewFile(
                    submission_id=submission.id,
                    image_url=image_url,
                    file_name=file.filename,
                )
                db.session.add(review_file)
                uploaded.append(review_file)

    db.session.commit()
    return jsonify({
        "message": f"{len(uploaded)} screenshots uploaded",
        "files": [f.to_dict() for f in uploaded],
    }), 201


@submissions_bp.route("/week/<week_id>", methods=["GET"])
@admin_required
def get_submissions_by_week(current_user, week_id):
    submissions = Submission.query.filter_by(week_id=week_id).all()
    return jsonify({"submissions": [s.to_dict() for s in submissions]}), 200


@submissions_bp.route("/candidate/<candidate_id>", methods=["GET"])
@token_required
def get_submissions_by_candidate(current_user, candidate_id):
    if current_user.role != "admin" and current_user.id != candidate_id:
        return jsonify({"error": "Access denied"}), 403
    project_id = request.args.get("project_id")
    query = Submission.query.join(Week, Submission.week_id == Week.id).filter(Submission.user_id == candidate_id)
    if project_id:
        query = query.filter(Week.project_id == project_id)
    submissions = query.order_by(Submission.created_at.desc()).all()
    return jsonify({"submissions": [s.to_dict() for s in submissions]}), 200
