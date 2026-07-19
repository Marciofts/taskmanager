"""
Task Manager - Flask application entry point.

Serves:
  - /api/*   the JSON API (see routes.py)
  - /*       the built React frontend (static/ folder, populated by the
             CI/CD pipeline during the frontend build step)
"""

import logging
import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from database import db

logger = logging.getLogger(__name__)


def _configure_app_insights(app):
    """Wire up Azure Application Insights if a connection string is set.
    Safe no-op if the env var is missing (e.g. local dev)."""
    conn_string = app.config.get("APPINSIGHTS_CONNECTION_STRING")
    if not conn_string:
        logger.info("APPINSIGHTS_CONNECTION_STRING not set - App Insights disabled")
        return

    try:
        from opencensus.ext.azure.log_exporter import AzureLogHandler

        # Sends app logs (including exceptions logged via logger.exception)
        # to App Insights. Request-level tracing can be added later with
        # opencensus-ext-flask once it supports Flask 3.
        logger.addHandler(AzureLogHandler(connection_string=conn_string))
        logging.getLogger("werkzeug").addHandler(AzureLogHandler(connection_string=conn_string))
        logger.info("App Insights configured")
    except Exception as exc:  # pragma: no cover - defensive, don't crash boot
        logger.warning("Could not initialize App Insights: %s", exc)


def create_app():
    static_folder = os.path.join(os.path.dirname(__file__), "static")
    # static_folder=None disables Flask's implicit static route so our
    # explicit catch-all below can handle both static files and the
    # SPA fallback (serving index.html for any unknown path).
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db.init_app(app)

    from routes import tasks_bp

    app.register_blueprint(tasks_bp, url_prefix="/api")

    _configure_app_insights(app)

    with app.app_context():
        db.create_all()  # no-op if tables already exist (e.g. via schema.sql)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    # --- Serve the React build for every non-API route ---------------
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        full_path = os.path.join(static_folder, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(static_folder, path)
        return send_from_directory(static_folder, "index.html")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT)
