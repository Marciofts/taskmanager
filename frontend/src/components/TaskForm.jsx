import React, { useState } from "react";

const EMPTY = { title: "", description: "", priority: "Medium", due_date: "" };

export default function TaskForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give the task a title.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        ...form,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      });
      setForm(EMPTY);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button className="btn-primary add-task-trigger" onClick={() => setOpen(true)}>
        + New task
      </button>
    );
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          autoFocus
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Call estate agent about Clapham deal"
          maxLength={200}
        />
      </div>

      <div className="form-row">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Optional details"
          rows={3}
        />
      </div>

      <div className="form-row-group">
        <div className="form-row">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) => update("priority", e.target.value)}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="due_date">Due date</label>
          <input
            id="due_date"
            type="datetime-local"
            value={form.due_date}
            onChange={(e) => update("due_date", e.target.value)}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => { setOpen(false); setForm(EMPTY); setError(null); }}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
}
