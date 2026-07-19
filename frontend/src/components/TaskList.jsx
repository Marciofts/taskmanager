import React from "react";
import TaskCard from "./TaskCard";

export default function TaskList({ tasks, onUpdate, onComplete, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>No tasks here.</p>
        <p className="empty-state-sub">Add one above to get started.</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdate={onUpdate}
          onComplete={onComplete}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
