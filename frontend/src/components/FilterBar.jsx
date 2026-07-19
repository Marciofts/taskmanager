import React from "react";

export default function FilterBar({ statusFilter, setStatusFilter, sort, setSort, taskCount }) {
  return (
    <div className="filter-bar">
      <div className="filter-group" role="group" aria-label="Filter by status">
        {["All", "Pending", "Completed"].map((option) => (
          <button
            key={option}
            className={`filter-chip ${statusFilter === option ? "active" : ""}`}
            onClick={() => setStatusFilter(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="sort-group">
        <label htmlFor="sort-select" className="sort-label">
          Sort by
        </label>
        <select
          id="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="sort-select"
        >
          <option value="-created_at">Newest first</option>
          <option value="due_date">Due date (soonest)</option>
          <option value="-priority">Priority (high to low)</option>
        </select>
      </div>

      <div className="task-count">{taskCount} task{taskCount === 1 ? "" : "s"}</div>
    </div>
  );
}
