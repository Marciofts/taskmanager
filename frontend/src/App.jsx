import React, { useCallback, useEffect, useState } from "react";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import FilterBar from "./components/FilterBar";
import { fetchTasks, createTask, updateTask, completeTask, deleteTask } from "./api";
import "./App.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("-created_at");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sort };
      if (statusFilter !== "All") params.status = statusFilter;
      const data = await fetchTasks(params);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sort]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function handleCreate(task) {
    const created = await createTask(task);
    setTasks((prev) => [created, ...prev]);
  }

  async function handleUpdate(id, updates) {
    const updated = await updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleComplete(id) {
    const updated = await completeTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }

  async function handleDelete(id) {
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <span className="eyebrow">Task Manager</span>
          <h1>What needs doing</h1>
        </div>
        <TaskForm onCreate={handleCreate} />
      </header>

      <FilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sort={sort}
        setSort={setSort}
        taskCount={tasks.length}
      />

      {error && <div className="banner-error">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading tasks…</div>
      ) : (
        <TaskList
          tasks={tasks}
          onUpdate={handleUpdate}
          onComplete={handleComplete}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
