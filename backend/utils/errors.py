"""
Centralized HTTP error response helpers for backend routes.

Usage:
    from utils.errors import not_found, forbidden, bad_request, conflict, server_error

    return not_found("Submission")
    return bad_request("GitHub URL is required")
"""

from flask import jsonify


def bad_request(message: str):
    """400 Bad Request — invalid input or missing required field."""
    return jsonify({"error": message}), 400


def unauthorized(message: str = "Authentication required"):
    """401 Unauthorized — missing or invalid token."""
    return jsonify({"error": message}), 401


def forbidden(message: str = "Access denied"):
    """403 Forbidden — authenticated but not authorized."""
    return jsonify({"error": message}), 403


def not_found(resource: str = "Resource"):
    """404 Not Found — record does not exist."""
    return jsonify({"error": f"{resource} not found"}), 404


def conflict(message: str):
    """409 Conflict — duplicate record or state conflict."""
    return jsonify({"error": message}), 409


def unprocessable(message: str):
    """422 Unprocessable Entity — validation failure."""
    return jsonify({"error": message}), 422


def server_error(message: str = "An unexpected error occurred"):
    """500 Internal Server Error — unexpected failure."""
    return jsonify({"error": message}), 500
