from flask import Blueprint, request, jsonify
from extensions import db
from models.linkedin import PostSubmission, PostMedia, PostReview, SubmissionActivity
from models.user import User
from models.notification import Notification
from middleware.auth import token_required, admin_required
from utils.upload import save_file, get_file_url
from datetime import datetime

linkedin_bp = Blueprint("linkedin", __name__)


# -------------------------------------------------------------
# CANDIDATE ENDPOINTS
# -------------------------------------------------------------

@linkedin_bp.route("/candidate/submissions", methods=["GET"])
@token_required
def get_candidate_submissions(current_user):
    """Get all LinkedIn submissions belonging to the logged-in candidate."""
    submissions = PostSubmission.query.filter_by(user_id=current_user.id).order_by(PostSubmission.updated_at.desc()).all()
    return jsonify({"submissions": [s.to_dict() for s in submissions]}), 200


@linkedin_bp.route("/submissions/<submission_id>", methods=["GET"])
@token_required
def get_submission_details(current_user, submission_id):
    """Get single submission details with media, reviews, and timeline activities."""
    submission = PostSubmission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    # Allow access if user is owner or admin
    if current_user.role != "admin" and submission.user_id != current_user.id:
        return jsonify({"error": "Unauthorized access to submission"}), 403

    return jsonify({"submission": submission.to_dict()}), 200


@linkedin_bp.route("/upload", methods=["POST"])
@token_required
def upload_media(current_user):
    """Upload up to 5 media files (images/video) and return their URLs."""
    files = request.files.getlist("images") or request.files.getlist("file") or request.files.getlist("screenshots")
    if not files or len(files) == 0:
        return jsonify({"error": "No files provided"}), 400

    if len(files) > 5:
        return jsonify({"error": "Maximum 5 images allowed"}), 400

    saved_urls = []
    for file in files:
        if file and file.filename:
            filepath = save_file(file)
            if filepath:
                url = get_file_url(filepath)
                saved_urls.append(url)

    return jsonify({"urls": saved_urls, "message": f"{len(saved_urls)} file(s) uploaded successfully"}), 200


@linkedin_bp.route("/draft", methods=["POST"])
@token_required
def save_draft(current_user):
    """Save or update a post submission in Draft status."""
    data = request.get_json(silent=True) or {}
    submission_id = data.get("id")
    caption = data.get("caption", "")
    platform = data.get("platform", "LinkedIn")
    media_urls = data.get("media_urls", [])
    posting_date = data.get("posting_date")
    posting_time = data.get("posting_time")

    if submission_id:
        submission = PostSubmission.query.filter_by(id=submission_id, user_id=current_user.id).first()
        if not submission:
            return jsonify({"error": "Draft not found"}), 404
        submission.caption = caption
        submission.platform = platform
        submission.posting_date = posting_date
        submission.posting_time = posting_time
        submission.updated_at = datetime.utcnow()
    else:
        submission = PostSubmission(
            user_id=current_user.id,
            platform=platform,
            caption=caption,
            status="Draft",
            posting_date=posting_date,
            posting_time=posting_time,
        )
        db.session.add(submission)
        db.session.flush()

        # Log Activity: Draft Created
        activity = SubmissionActivity(
            submission_id=submission.id,
            action="Draft Created",
            actor_id=current_user.id,
            actor_name=current_user.name,
            details="Draft created by candidate",
        )
        db.session.add(activity)

    # Sync Media
    if isinstance(media_urls, list):
        # Remove old media not in new list or replace
        PostMedia.query.filter_by(submission_id=submission.id).delete()
        for url in media_urls[:5]:
            if url:
                m = PostMedia(submission_id=submission.id, image_url=url)
                db.session.add(m)

    db.session.commit()
    return jsonify({"message": "Draft saved successfully", "submission": submission.to_dict()}), 200


@linkedin_bp.route("/submit", methods=["POST"])
@token_required
def submit_for_approval(current_user):
    """Submit a draft or new post for mentor approval."""
    data = request.get_json(silent=True) or {}
    submission_id = data.get("id")
    caption = data.get("caption", "").strip()
    platform = data.get("platform", "LinkedIn")
    media_urls = data.get("media_urls", [])
    posting_date = data.get("posting_date")
    posting_time = data.get("posting_time")

    if not caption:
        return jsonify({"error": "Post caption cannot be empty"}), 400

    if submission_id:
        submission = PostSubmission.query.filter_by(id=submission_id, user_id=current_user.id).first()
        if not submission:
            return jsonify({"error": "Submission not found"}), 404
        submission.caption = caption
        submission.platform = platform
        submission.status = "Pending Review"
        submission.posting_date = posting_date
        submission.posting_time = posting_time
        submission.updated_at = datetime.utcnow()
    else:
        submission = PostSubmission(
            user_id=current_user.id,
            platform=platform,
            caption=caption,
            status="Pending Review",
            posting_date=posting_date,
            posting_time=posting_time,
        )
        db.session.add(submission)
        db.session.flush()

    # Sync Media
    if isinstance(media_urls, list):
        PostMedia.query.filter_by(submission_id=submission.id).delete()
        for url in media_urls[:5]:
            if url:
                m = PostMedia(submission_id=submission.id, image_url=url)
                db.session.add(m)

    # Log Activity: Submitted for Approval
    activity = SubmissionActivity(
        submission_id=submission.id,
        action="Submitted for Approval",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details="Submitted by candidate for mentor review",
    )
    db.session.add(activity)

    # Notify all admins
    admins = User.query.filter_by(role="admin").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="New LinkedIn Submission",
            message=f"{current_user.name} submitted a LinkedIn announcement post for review.",
            type="linkedin_submission",
            link="/admin/linkedin",
        )
        db.session.add(notif)

    # Notify candidate that submission was received
    cand_notif = Notification(
        user_id=current_user.id,
        title="Post Submitted for Review",
        message="Your LinkedIn post has been submitted. Your manager/mentor will review it shortly.",
        type="linkedin_submitted",
        link="/linkedin",
    )
    db.session.add(cand_notif)

    db.session.commit()
    return jsonify({"message": "Post submitted for approval!", "submission": submission.to_dict()}), 201


@linkedin_bp.route("/resubmit/<submission_id>", methods=["POST"])
@token_required
def resubmit_post(current_user, submission_id):
    """Candidate edits and resubmits a post that was marked Needs Changes."""
    submission = PostSubmission.query.filter_by(id=submission_id, user_id=current_user.id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    data = request.get_json(silent=True) or {}
    caption = data.get("caption", "").strip()
    platform = data.get("platform", submission.platform or "LinkedIn")
    media_urls = data.get("media_urls", [])
    posting_date = data.get("posting_date", submission.posting_date)
    posting_time = data.get("posting_time", submission.posting_time)

    if not caption:
        return jsonify({"error": "Caption cannot be empty"}), 400

    submission.caption = caption
    submission.platform = platform
    submission.posting_date = posting_date
    submission.posting_time = posting_time
    submission.status = "Pending Review"
    submission.updated_at = datetime.utcnow()

    # Sync media
    if isinstance(media_urls, list):
        PostMedia.query.filter_by(submission_id=submission.id).delete()
        for url in media_urls[:5]:
            if url:
                m = PostMedia(submission_id=submission.id, image_url=url)
                db.session.add(m)

    # Log Activities: Candidate Updated, Submitted for Approval
    act_updated = SubmissionActivity(
        submission_id=submission.id,
        action="Candidate Updated",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details="Candidate revised caption and media according to feedback",
    )
    act_submitted = SubmissionActivity(
        submission_id=submission.id,
        action="Submitted for Approval",
        actor_id=current_user.id,
        actor_name=current_user.name,
        details="Resubmitted for mentor review",
    )
    db.session.add(act_updated)
    db.session.add(act_submitted)

    # Notify admins of resubmission
    admins = User.query.filter_by(role="admin").all()
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="LinkedIn Post Resubmitted",
            message=f"{current_user.name} revised and resubmitted their LinkedIn post.",
            type="linkedin_resubmission",
            link="/admin/linkedin",
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({"message": "Post revised and resubmitted successfully!", "submission": submission.to_dict()}), 200


# -------------------------------------------------------------
# ADMIN / MENTOR ENDPOINTS
# -------------------------------------------------------------

@linkedin_bp.route("/admin/submissions", methods=["GET"])
@admin_required
def admin_get_submissions(current_user):
    """Admin endpoint to view all candidate submissions with optional status filter."""
    status_filter = request.args.get("status")
    query = PostSubmission.query

    if status_filter and status_filter.lower() != "all":
        query = query.filter(PostSubmission.status == status_filter)

    submissions = query.order_by(PostSubmission.updated_at.desc()).all()
    return jsonify({"submissions": [s.to_dict() for s in submissions]}), 200


@linkedin_bp.route("/admin/submissions/<submission_id>/view", methods=["POST"])
@admin_required
def admin_mark_viewed(current_user, submission_id):
    """Log 'Viewed by admin' in timeline if not recently logged."""
    submission = PostSubmission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    try:
        # Check if already logged recently
        recent = SubmissionActivity.query.filter_by(
            submission_id=submission.id,
            action="Viewed by admin",
            actor_id=current_user.id,
        ).order_by(SubmissionActivity.created_at.desc()).first()

        if not recent:
            act = SubmissionActivity(
                submission_id=submission.id,
                action="Viewed by admin",
                actor_id=current_user.id,
                actor_name=current_user.name,
                details=f"Viewed by mentor {current_user.name}",
            )
            db.session.add(act)
            db.session.commit()

        return jsonify({"message": "Viewed logged"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to log view: {str(e)}"}), 500


@linkedin_bp.route("/admin/submissions/<submission_id>/review", methods=["POST"])
@admin_required
def admin_review_submission(current_user, submission_id):
    """Admin reviews submission: 'Approved' or 'Needs Changes'."""
    submission = PostSubmission.query.filter_by(id=submission_id).first()
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    data = request.get_json(silent=True) or {}
    decision = data.get("decision")  # "Approved" or "Needs Changes"
    feedback = (data.get("feedback") or "").strip()

    if decision not in ["Approved", "Needs Changes"]:
        return jsonify({"error": "Decision must be 'Approved' or 'Needs Changes'"}), 400

    if decision == "Needs Changes" and not feedback:
        return jsonify({"error": "Feedback is required when requesting changes."}), 400

    try:
        # Update Submission status
        submission.status = decision
        submission.updated_at = datetime.utcnow()

        # Create Review Record
        review = PostReview(
            submission_id=submission.id,
            admin_id=current_user.id,
            feedback=feedback if feedback else None,
            decision=decision,
            reviewed_at=datetime.utcnow(),
        )
        db.session.add(review)

        # Log Activities
        act_reviewed = SubmissionActivity(
            submission_id=submission.id,
            action="Mentor Reviewed",
            actor_id=current_user.id,
            actor_name=current_user.name,
            details=f"Reviewed by {current_user.name}",
        )
        db.session.add(act_reviewed)

        if decision == "Approved":
            act_decision = SubmissionActivity(
                submission_id=submission.id,
                action="Approved",
                actor_id=current_user.id,
                actor_name=current_user.name,
                details="Post approved for publishing on LinkedIn",
            )
            db.session.add(act_decision)

            # Notify Candidate
            notif = Notification(
                user_id=submission.user_id,
                title="LinkedIn Post Approved!",
                message="Congratulations! Your LinkedIn post announcement has been approved and is ready to post.",
                type="linkedin_approved",
                link="/linkedin",
            )
            db.session.add(notif)
        else:
            act_decision = SubmissionActivity(
                submission_id=submission.id,
                action="Needs Changes",
                actor_id=current_user.id,
                actor_name=current_user.name,
                details=f"Feedback: {feedback}",
            )
            db.session.add(act_decision)

            # Notify Candidate
            snip = (feedback[:80] + "...") if len(feedback) > 80 else feedback
            notif = Notification(
                user_id=submission.user_id,
                title="LinkedIn Post: Changes Requested",
                message=f"Mentor requested updates: \"{snip}\"",
                type="linkedin_needs_changes",
                link="/linkedin",
            )
            db.session.add(notif)

        db.session.commit()
        return jsonify({
            "message": f"Post marked as {decision}",
            "submission": submission.to_dict(),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to submit review: {str(e)}"}), 500
