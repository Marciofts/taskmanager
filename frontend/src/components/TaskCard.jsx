import React, { useState } from "react";

function formatDueDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  const now = new Date();
  const isOverdue = date < now;
  const formatted = date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return { formatted, isOverdue };
}

export default function TaskCard({ task, onUpdate, onComplete, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    due_date: task.due_date ? task.due_date.slice(0, 16) : "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const due = formatDueDate(task.due_date);
  const isCompleted = task.status === "Completed";

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title can't be empty.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onUpdate(task.id, {
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    try {
      await onComplete(task.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form className={`task-card priority-${task.priority.toLowerCase()} editing`} onSubmit={handleSave}>
        <div className="form-row">
          <label>Title</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={200} autoFocus />
        </div>
        <div className="form-row">
          <label>Description</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
        </div>
        <div className="form-row-group">
          <div className="form-row">
            <label>Priority</label>
            <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-row">
            <label>Status</label>
            <select value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="form-row">
            <label>Due date</label>
            <input type="datetime-local" value={form.due_date} onChange={(e) => update("due_date", e.target.value)} />
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`task-card priority-${task.priority.toLowerCase()} ${isCompleted ? "completed" : ""}`}>
      <div className="task-card-main">
        <div className="task-card-header">
          <h3 className="task-title">{task.title}</h3>
          <span className={`status-pill status-${task.status.toLowerCase()}`}>{task.status}</span>
        </div>

        {task.description && <p className="task-description">{task.description}</p>}

        <div className="task-meta">
          <span className={`priority-tag priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
          {due && (
            <span className={`due-date ${due.isOverdue && !isCompleted ? "overdue" : ""}`}>
              {due.isOverdue && !isCompleted ? "Overdue · " : "Due "}
              {due.formatted}
            </span>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>

      <div className="task-card-actions">
        {!isCompleted && (
          <button className="icon-btn complete" onClick={handleComplete} disabled={busy} title="Mark complete">
            ✓
          </button>
        )}
        <button className="icon-btn" onClick={() => setEditing(true)} disabled={busy} title="Edit task">
          ✎
        </button>
        <button className="icon-btn danger" onClick={handleDelete} disabled={busy} title="Delete task">
          ✕
        </button>
      </div>
    </div>
  );
}
