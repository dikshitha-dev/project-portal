from flask import Blueprint, request, jsonify
from models.grade import Grade
from models.submission import Submission
from models.week import Week
from middleware.auth import token_required, admin_required
from extensions import db

grades_bp = Blueprint("grades", __name__)


@grades_bp.route("/", methods=["POST"])
@admin_required
def create_or_update_grade(current_user):
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    submission_id = data.get("submission_id")
    if not submission_id:
        return jsonify({"error": "Submission ID is required"}), 400

    submission = Submission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    try:
        grade = Grade.query.filter_by(submission_id=submission_id).first()
        if not grade:
            grade = Grade(submission_id=submission_id)
            db.session.add(grade)

        grade.ui = data.get("ui", grade.ui)
        grade.functionality = data.get("functionality", grade.functionality)
        grade.github = data.get("github", grade.github)
        grade.documentation = data.get("documentation", grade.documentation)
        grade.innovation = data.get("innovation", grade.innovation)
        grade.weekly_progress = data.get("weekly_progress", grade.weekly_progress)
        grade.published = data.get("published", grade.published)

        grade.calculate_total()
        db.session.commit()

        result = {
            **grade.to_dict(),
            "week": submission.week.to_dict() if submission and submission.week else None,
            "user": submission.user.to_dict() if submission and submission.user else None,
        }

        return jsonify({"message": "Grade saved", "grade": result}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save grade: {str(e)}"}), 500


@grades_bp.route("/submission/<submission_id>", methods=["GET"])
@token_required
def get_grade(current_user, submission_id):
    grade = Grade.query.filter_by(submission_id=submission_id).first()
    if not grade:
        return jsonify({"error": "Grade not found"}), 404
    if current_user.role != "admin" and not grade.published:
        return jsonify({"error": "Grade not published yet"}), 403

    submission = Submission.query.get(submission_id)
    result = {
        **grade.to_dict(),
        "week": submission.week.to_dict() if submission and submission.week else None,
        "user": submission.user.to_dict() if submission and submission.user else None,
    }

    return jsonify({"grade": result}), 200


@grades_bp.route("/publish/<submission_id>", methods=["POST"])
@admin_required
def publish_grade(current_user, submission_id):
    grade = Grade.query.filter_by(submission_id=submission_id).first()
    if not grade:
        return jsonify({"error": "Grade not found"}), 404
    try:
        grade.published = True
        db.session.commit()

        submission = Submission.query.get(submission_id)
        result = {
            **grade.to_dict(),
            "week": submission.week.to_dict() if submission and submission.week else None,
            "user": submission.user.to_dict() if submission and submission.user else None,
        }

        return jsonify({"message": "Grade published", "grade": result}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to publish grade: {str(e)}"}), 500


@grades_bp.route("/candidate/<candidate_id>", methods=["GET"])
@token_required
def get_candidate_grades(current_user, candidate_id):
    if current_user.role != "admin" and current_user.id != candidate_id:
        return jsonify({"error": "Access denied"}), 403

    project_id = request.args.get("project_id")
    query = (
        db.session.query(Grade)
        .join(Submission, Grade.submission_id == Submission.id)
        .join(Week, Submission.week_id == Week.id)
        .filter(Submission.user_id == candidate_id)
    )
    if project_id:
        query = query.filter(Week.project_id == project_id)

    grades = query.all()

    result = []
    for g in grades:
        if current_user.role == "admin" or g.published:
            sub = Submission.query.get(g.submission_id)
            result.append({
                **g.to_dict(),
                "week": sub.week.to_dict() if sub and sub.week else None,
            })

    return jsonify({"grades": result}), 200


@grades_bp.route("/all", methods=["GET"])
@admin_required
def get_all_grades(current_user):
    grades = Grade.query.all()
    result = []
    for g in grades:
        sub = Submission.query.get(g.submission_id)
        result.append({
            **g.to_dict(),
            "week": sub.week.to_dict() if sub and sub.week else None,
            "user": sub.user.to_dict() if sub and sub.user else None,
        })
    return jsonify({"grades": result}), 200


@grades_bp.route("/stats/candidate/<candidate_id>", methods=["GET"])
@token_required
def get_candidate_stats(current_user, candidate_id):
    if current_user.role != "admin" and current_user.id != candidate_id:
        return jsonify({"error": "Access denied"}), 403

    project_id = request.args.get("project_id")
    query = (
        db.session.query(Grade)
        .join(Submission, Grade.submission_id == Submission.id)
        .join(Week, Submission.week_id == Week.id)
        .filter(Submission.user_id == candidate_id, Grade.published == True)
    )
    if project_id:
        query = query.filter(Week.project_id == project_id)

    grades = query.all()

    weekly_scores = []
    for g in grades:
        sub = Submission.query.get(g.submission_id)
        weekly_scores.append({
            "week": sub.week.week_title if sub and sub.week else "Unknown",
            "total": g.total,
            "grade": g.grade,
        })

    total_score = sum(g.total for g in grades) if grades else 0
    avg_score = total_score / len(grades) if grades else 0

    return jsonify({
        "weekly_scores": weekly_scores,
        "average_score": round(avg_score, 2),
        "total_graded": len(grades),
    }), 200


@grades_bp.route("/stats/overview", methods=["GET"])
@admin_required
def get_overview_stats(current_user):
    from models.user import User

    total_candidates = User.query.filter_by(role="candidate").count()
    total_submissions = Submission.query.count()
    published_grades = Grade.query.filter_by(published=True).all()
    avg_grade = (
        sum(g.total for g in published_grades) / len(published_grades)
        if published_grades
        else 0
    )
    pending_reviews = Submission.query.filter(
        ~Submission.id.in_(db.session.query(Grade.submission_id))
    ).count()

    return jsonify({
        "total_candidates": total_candidates,
        "total_submissions": total_submissions,
        "pending_reviews": pending_reviews,
        "average_grade": round(avg_grade, 2),
    }), 200
