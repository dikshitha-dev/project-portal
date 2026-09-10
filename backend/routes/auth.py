import re
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import User
from utils.jwt import generate_token
from middleware.auth import token_required, admin_required
from extensions import db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    name = (data.get("name") or data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password")
    role = data.get("role", "candidate")

    if not name:
        return jsonify({"error": "Username is required"}), 400
    if not password:
        return jsonify({"error": "Password is required"}), 400

    if not email:
        sanitized = re.sub(r"[^a-zA-Z0-9_.-]", "", name.lower()) or "candidate"
        email = f"{sanitized}@candidate.portal"

    if role not in ("admin", "candidate"):
        return jsonify({"error": "Role must be admin or candidate"}), 400

    # Check if username or email already exists
    if User.query.filter((User.email.ilike(email)) | (User.name.ilike(name))).first():
        if User.query.filter(User.email.ilike(email)).first():
            return jsonify({"error": "Email is already registered"}), 409
        return jsonify({"error": "Username is already taken. Please choose another."}), 409

    user = User(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role,
    )
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id, user.role)
    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Username or email and password are required"}), 400

    user = User.query.filter(
        (User.email.ilike(identifier)) | (User.name.ilike(identifier))
    ).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials. Please check your username/email and password."}), 401

    token = generate_token(user.id, user.role)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return jsonify({"user": current_user.to_dict()}), 200


@auth_bp.route("/candidates", methods=["GET"])
@admin_required
def get_candidates(current_user):
    candidates = User.query.filter_by(role="candidate").all()
    return jsonify({"candidates": [c.to_dict() for c in candidates]}), 200


@auth_bp.route("/candidates/<candidate_id>", methods=["GET"])
@admin_required
def get_candidate(current_user, candidate_id):
    candidate = User.query.filter_by(id=candidate_id, role="candidate").first()
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify({"candidate": candidate.to_dict()}), 200
