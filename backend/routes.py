"""
Task API - all routes are prefixed with /api by the blueprint registration
in app.py.

Endpoints
---------
GET    /api/tasks              list tasks (supports ?status=, ?priority=, ?sort=)
POST   /api/tasks               create a task
GET    /api/tasks/<id>          get one task
PUT    /api/tasks/<id>          update a task (title/description/priority/status/due_date)
PATCH  /api/tasks/<id>/complete mark a task as Completed
DELETE /api/tasks/<id>          delete a task
"""

from datetime import datetime

from flask import Blueprint, jsonify, request

from database import db
from models import VALID_PRIORITIES, VALID_STATUSES, Task

tasks_bp = Blueprint("tasks", __name__)

SORT_OPTIONS = {
    "due_date": Task.due_date.asc(),
    "-due_date": Task.due_date.desc(),
    "priority": Task.priority.asc(),
    "-priority": Task.priority.desc(),
    "created_at": Task.created_at.asc(),
    "-created_at": Task.created_at.desc(),
}

# Used to sort "High > Medium > Low" meaningfully rather than alphabetically
PRIORITY_RANK = {"High": 0, "Medium": 1, "Low": 2}


def _parse_due_date(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError("due_date must be an ISO 8601 date/datetime string")


def _validate_payload(data, partial=False):
    """Validate incoming task fields. Raises ValueError with a message."""
    errors = []

    if not partial or "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            errors.append("title is required")
        elif len(title) > 200:
            errors.append("title must be 200 characters or fewer")

    if "priority" in data and data["priority"] not in VALID_PRIORITIES:
        errors.append(f"priority must be one of {VALID_PRIORITIES}")

    if "status" in data and data["status"] not in VALID_STATUSES:
        errors.append(f"status must be one of {VALID_STATUSES}")

    if errors:
        raise ValueError("; ".join(errors))


@tasks_bp.route("/tasks", methods=["GET"])
def list_tasks():
    query = Task.query

    status = request.args.get("status")
    if status:
        if status not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {VALID_STATUSES}"}), 400
        query = query.filter(Task.status == status)

    priority = request.args.get("priority")
    if priority:
        if priority not in VALID_PRIORITIES:
            return jsonify({"error": f"priority must be one of {VALID_PRIORITIES}"}), 400
        query = query.filter(Task.priority == priority)

    sort = request.args.get("sort", "-created_at")
    if sort == "priority" or sort == "-priority":
        # Rank-based sort so High/Medium/Low order makes sense
        tasks = query.all()
        reverse = sort.startswith("-")
        tasks.sort(key=lambda t: PRIORITY_RANK.get(t.priority, 99), reverse=reverse)
    else:
        if sort not in SORT_OPTIONS:
            return jsonify({"error": f"sort must be one of {list(SORT_OPTIONS)}"}), 400
        tasks = query.order_by(SORT_OPTIONS[sort]).all()

    return jsonify([t.to_dict() for t in tasks])


@tasks_bp.route("/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    return jsonify(task.to_dict())


@tasks_bp.route("/tasks", methods=["POST"])
def create_task():
    data = request.get_json(silent=True) or {}

    try:
        _validate_payload(data)
        due_date = _parse_due_date(data.get("due_date"))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    task = Task(
        title=data["title"].strip(),
        description=(data.get("description") or "").strip() or None,
        priority=data.get("priority", "Medium"),
        status=data.get("status", "Pending"),
        due_date=due_date,
    )
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201


@tasks_bp.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json(silent=True) or {}

    try:
        _validate_payload(data, partial=True)
        due_date = _parse_due_date(data["due_date"]) if "due_date" in data else None
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if "title" in data:
        task.title = data["title"].strip()
    if "description" in data:
        task.description = (data.get("description") or "").strip() or None
    if "priority" in data:
        task.priority = data["priority"]
    if "status" in data:
        task.status = data["status"]
    if "due_date" in data:
        task.due_date = due_date

    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>/complete", methods=["PATCH"])
def complete_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.status = "Completed"
    db.session.commit()
    return jsonify(task.to_dict())


@tasks_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return "", 204
