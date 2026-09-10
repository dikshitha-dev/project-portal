import os
from flask import Flask
from flask_cors import CORS
from extensions import db
from config import config_by_name


def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", ["http://localhost:3000", "http://localhost:3001"])}})

    from routes.auth import auth_bp
    from routes.weeks import weeks_bp
    from routes.submissions import submissions_bp
    from routes.reviews import reviews_bp
    from routes.grades import grades_bp
    from routes.projects import projects_bp
    from routes.notifications import notifications_bp
    from routes.linkedin import linkedin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(weeks_bp, url_prefix="/api/weeks")
    app.register_blueprint(submissions_bp, url_prefix="/api/submissions")
    app.register_blueprint(reviews_bp, url_prefix="/api/reviews")
    app.register_blueprint(grades_bp, url_prefix="/api/grades")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(linkedin_bp, url_prefix="/api/linkedin")

    @app.route("/api/health")
    def health_check():
        return {"status": "ok"}, 200

    return app


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        from models.user import User
        from models.week import Week
        from models.submission import Submission, ReviewFile, Annotation
        from models.issue import Issue
        from models.grade import Grade
        from models.project import Project, ProjectMember, ProjectJoinRequest
        from models.notification import Notification
        from models.linkedin import PostSubmission, PostMedia, PostReview, SubmissionActivity
        db.create_all()

        # Safe migrations: check if column exists before adding (SQLite-compatible)
        def add_column_if_missing(table_name, column_def):
            col_name = column_def.split()[0]
            try:
                with db.engine.connect() as conn:
                    result = conn.execute(db.text(f"PRAGMA table_info({table_name})"))
                    existing_cols = [row[1] for row in result]
                    if col_name not in existing_cols:
                        conn.execute(db.text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))
                        conn.commit()
                        print(f"Migrated {table_name}: added {col_name}")
            except Exception:
                pass

        add_column_if_missing("weeks", "project_id VARCHAR(36)")
        add_column_if_missing("users", "profile_image VARCHAR(500)")
        add_column_if_missing("submissions", "project_description TEXT")
        add_column_if_missing("submissions", "what_learned TEXT")
        add_column_if_missing("submissions", "difficulties_faced TEXT")
        add_column_if_missing("submissions", "status VARCHAR(50) DEFAULT 'Submitted'")

        if not db.session.query(User).filter_by(email="admin@portal.com").first():
            from werkzeug.security import generate_password_hash
            admin = User(
                name="Admin",
                email="admin@portal.com",
                password=generate_password_hash("admin"),
                role="admin",
            )
            db.session.add(admin)
            db.session.commit()
            print("Seeded admin user: admin@portal.com / admin")
        else:
            print("Admin user already exists.")
    app.run(debug=False, port=5000)
