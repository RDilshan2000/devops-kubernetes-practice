const API_BASE = "/api";

async function loadTasks() {
  const res = await fetch(`${API_BASE}/tasks`);
  const tasks = await res.json();

  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((task) => {
    const li = document.createElement("li");
    li.textContent = `${task.title} - ${task.done ? "Done" : "Pending"}`;
    li.onclick = async () => {
      await fetch(`${API_BASE}/tasks/${task.id}/toggle`, { method: "PATCH" });
      loadTasks();
    };
    list.appendChild(li);
  });
}

async function addTask() {
  const input = document.getElementById("taskInput");
  const title = input.value.trim();
  if (!title) return;

  await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });

  input.value = "";
  loadTasks();
}

loadTasks();
