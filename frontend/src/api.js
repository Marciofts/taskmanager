const BASE = "/api";

async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function fetchTasks({ status, priority, sort } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  const res = await fetch(`${BASE}/tasks${qs ? `?${qs}` : ""}`);
  return handleResponse(res);
}

export async function createTask(task) {
  const res = await fetch(`${BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return handleResponse(res);
}

export async function updateTask(id, updates) {
  const res = await fetch(`${BASE}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleResponse(res);
}

export async function completeTask(id) {
  const res = await fetch(`${BASE}/tasks/${id}/complete`, { method: "PATCH" });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE}/tasks/${id}`, { method: "DELETE" });
  return handleResponse(res);
}
