from flask import Blueprint, request, jsonify, send_from_directory
from models.submission import Annotation, ReviewFile
from models.issue import Issue
from middleware.auth import token_required, admin_required
from utils.upload import save_file, get_file_url
from extensions import db
import os

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.route("/annotations/<image_id>", methods=["GET"])
@token_required
def get_annotations(current_user, image_id):
    annotations = Annotation.query.filter_by(image_id=image_id).all()
    return jsonify({"annotations": [a.to_dict() for a in annotations]}), 200


@reviews_bp.route("/annotations", methods=["POST"])
@admin_required
def create_annotation(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    annotation = Annotation(
        image_id=data["image_id"],
        tool_type=data["tool_type"],
        coordinates=data["coordinates"],
        color=data.get("color", "#7C3AED"),
        text=data.get("text"),
    )
    db.session.add(annotation)
    db.session.commit()

    return jsonify({"message": "Annotation created", "annotation": annotation.to_dict()}), 201


@reviews_bp.route("/annotations/<annotation_id>", methods=["PUT"])
@admin_required
def update_annotation(current_user, annotation_id):
    annotation = Annotation.query.filter_by(id=annotation_id).first()
    if not annotation:
        return jsonify({"error": "Annotation not found"}), 404

    data = request.get_json()
    if data.get("coordinates"):
        annotation.coordinates = data["coordinates"]
    if data.get("color"):
        annotation.color = data["color"]
    if data.get("text") is not None:
        annotation.text = data["text"]

    db.session.commit()
    return jsonify({"message": "Annotation updated", "annotation": annotation.to_dict()}), 200


@reviews_bp.route("/annotations/<annotation_id>", methods=["DELETE"])
@admin_required
def delete_annotation(current_user, annotation_id):
    annotation = Annotation.query.filter_by(id=annotation_id).first()
    if not annotation:
        return jsonify({"error": "Annotation not found"}), 404

    db.session.delete(annotation)
    db.session.commit()
    return jsonify({"message": "Annotation deleted"}), 200


@reviews_bp.route("/issues", methods=["POST"])
@admin_required
def create_issue(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    issue = Issue(
        annotation_id=data["annotation_id"],
        title=data["title"],
        description=data.get("description"),
        priority=data.get("priority", "Medium"),
        status=data.get("status", "To Do"),
        reference_file_url=data.get("reference_file_url"),
        mark_deduction=data.get("mark_deduction", 0),
    )
    db.session.add(issue)
    db.session.commit()

    return jsonify({"message": "Issue created", "issue": issue.to_dict()}), 201


@reviews_bp.route("/issues/<issue_id>", methods=["PUT"])
@admin_required
def update_issue(current_user, issue_id):
    issue = Issue.query.filter_by(id=issue_id).first()
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    data = request.get_json()
    if data.get("title"):
        issue.title = data["title"]
    if data.get("description") is not None:
        issue.description = data["description"]
    if data.get("priority"):
        issue.priority = data["priority"]
    if data.get("status"):
        issue.status = data["status"]
    if data.get("reference_file_url") is not None:
        issue.reference_file_url = data["reference_file_url"]
    if data.get("mark_deduction") is not None:
        issue.mark_deduction = data["mark_deduction"]

    db.session.commit()
    return jsonify({"message": "Issue updated", "issue": issue.to_dict()}), 200


@reviews_bp.route("/issues/<issue_id>", methods=["DELETE"])
@admin_required
def delete_issue(current_user, issue_id):
    issue = Issue.query.filter_by(id=issue_id).first()
    if not issue:
        return jsonify({"error": "Issue not found"}), 404

    db.session.delete(issue)
    db.session.commit()
    return jsonify({"message": "Issue deleted"}), 200


@reviews_bp.route("/issues/submission/<submission_id>", methods=["GET"])
@token_required
def get_issues_by_submission(current_user, submission_id):
    from models.submission import Submission
    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    file_ids = [f.id for f in submission.review_files]
    annotations = Annotation.query.filter(Annotation.image_id.in_(file_ids)).all()
    annotation_ids = [a.id for a in annotations]
    issues = Issue.query.filter(Issue.annotation_id.in_(annotation_ids)).all()

    return jsonify({"issues": [i.to_dict() for i in issues]}), 200


@reviews_bp.route("/issues/candidate/<candidate_id>", methods=["GET"])
@token_required
def get_issues_by_candidate(current_user, candidate_id):
    if current_user.role != "admin" and current_user.id != candidate_id:
        return jsonify({"error": "Access denied"}), 403

    from models.submission import Submission
    submissions = Submission.query.filter_by(user_id=candidate_id).all()
    all_issues = []
    for sub in submissions:
        file_ids = [f.id for f in sub.review_files]
        annotations = Annotation.query.filter(Annotation.image_id.in_(file_ids)).all()
        annotation_ids = [a.id for a in annotations]
        issues = Issue.query.filter(Issue.annotation_id.in_(annotation_ids)).all()
        all_issues.extend([i.to_dict() for i in issues])

    return jsonify({"issues": all_issues}), 200


@reviews_bp.route("/uploads/<filename>", methods=["GET"])
def serve_upload(filename):
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    return send_from_directory(upload_folder, filename)


@reviews_bp.route("/reference-upload", methods=["POST"])
@admin_required
def upload_reference(current_user):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    filepath = save_file(file)
    if not filepath:
        return jsonify({"error": "Invalid file type"}), 400

    url = get_file_url(filepath)
    return jsonify({"url": url}), 201
