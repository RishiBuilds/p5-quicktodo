const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

let todos = [];
let filter = "all";
let editIdx = null;
let theme = "light";

function loadData() {
  try {
    const storedTodos = localStorage.getItem("todos");
    if (storedTodos) {
      const parsed = JSON.parse(storedTodos);
      if (Array.isArray(parsed)) {
        todos = parsed.filter(t => t && typeof t === "object" && "text" in t && "completed" in t);
      }
    }
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      theme = storedTheme;
    }
    const storedFilter = localStorage.getItem("filter");
    if (["all", "active", "completed"].includes(storedFilter)) {
      filter = storedFilter;
    }
  } catch (e) {
    console.warn("Could not load from localStorage:", e);
    todos = [];
  }
}

function save() {
  try {
    localStorage.setItem("todos", JSON.stringify(todos));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

function setTheme(t) {
  theme = t;
  document.body.setAttribute("data-theme", t);
  const themeToggle = $("theme-toggle");
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(t === "dark"));
    themeToggle.setAttribute("aria-label", `Switch to ${t === "light" ? "dark" : "light"} mode`);
  }
  try {
    localStorage.setItem("theme", t);
  } catch (e) {
    console.warn("Could not save theme to localStorage:", e);
  }
}

function updateStats() {
  const totalTasks = $("total-tasks");
  const activeTasks = $("active-tasks");
  const completedTasks = $("completed-tasks");
  
  if (totalTasks) totalTasks.textContent = todos.length;
  if (activeTasks) activeTasks.textContent = todos.filter(t => !t.completed).length;
  if (completedTasks) completedTasks.textContent = todos.filter(t => t.completed).length;
}

function getFiltered() {
  if (filter === "active") return todos.filter(t => !t.completed);
  if (filter === "completed") return todos.filter(t => t.completed);
  return todos;
}

function render() {
  const list = $("todo-list");
  if (!list) return;
  
  list.innerHTML = "";
  const filtered = getFiltered();

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    const message = filter === "all" ? "yet" : filter;
    const hint = filter === "all" ? "Add a task to get started!" : "";
    empty.innerHTML = `<p>No tasks ${message}</p><small>${hint}</small>`;
    list.appendChild(empty);
    updateStats();
    return;
  }

  filtered.forEach(todo => {
    const realIndex = todos.indexOf(todo);
    if (realIndex === -1) return;
    
    const li = document.createElement("li");
    if (todo.completed) li.classList.add("completed");

    const checkBtn = document.createElement("button");
    checkBtn.className = "check-btn";
    checkBtn.setAttribute("aria-pressed", String(todo.completed));
    checkBtn.setAttribute("aria-label", todo.completed ? "Mark as active" : "Mark as completed");
    checkBtn.onclick = () => toggle(realIndex);
    const checkImg = document.createElement("img");
    checkImg.src = "check.svg";
    checkImg.alt = "Complete";
    checkBtn.appendChild(checkImg);

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    text.tabIndex = 0;
    text.setAttribute("role", "button");
    text.setAttribute("aria-pressed", String(todo.completed));
    text.title = todo.completed ? "Mark as active" : "Mark as completed";
    text.onclick = () => toggle(realIndex);
    text.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle(realIndex);
      }
    };

    const actions = document.createElement("div");
    actions.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit-btn";
    editBtn.onclick = () => openEdit(realIndex);
    editBtn.innerHTML = `<img src="edit.svg" alt="Edit">`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.onclick = () => deleteTodo(realIndex);
    deleteBtn.innerHTML = `<img src="del.svg" alt="Delete">`;

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    li.appendChild(checkBtn);
    li.appendChild(text);
    li.appendChild(actions);
    list.appendChild(li);
  });

  updateStats();
}

function add() {
  const input = $("todo-input");
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }
  
  todos.unshift({ text, completed: false });
  input.value = "";
  save();
  render();
  input.focus();
}

function toggle(idx) {
  if (!todos[idx]) return;
  todos[idx].completed = !todos[idx].completed;
  save();
  render();
}

function deleteTodo(idx) {
  if (!todos[idx]) return;
  if (confirm("Delete this task?")) {
    todos.splice(idx, 1);
    save();
    render();
  }
}

function openEdit(idx) {
  if (!todos[idx]) return;
  editIdx = idx;
  const editInput = $("edit-input");
  const editModal = $("edit-modal");
  if (!editInput || !editModal) return;
  editInput.value = todos[idx].text;
  editModal.classList.add("show");
  editInput.focus();
}

// Close edit modal
function closeEdit() {
  const editModal = $("edit-modal");
  const editInput = $("edit-input");
  if (editModal) editModal.classList.remove("show");
  if (editInput) editInput.value = "";
  editIdx = null;
}

function saveEdit() {
  if (editIdx === null || !todos[editIdx]) return;
  const editInput = $("edit-input");
  if (!editInput) return;
  
  const text = editInput.value.trim();
  if (!text) {
    editInput.focus();
    return;
  }
  
  todos[editIdx].text = text;
  save();
  render();
  closeEdit();
}

function clearCompleted() {
  const count = todos.filter(t => t.completed).length;
  if (count === 0) {
    alert("No completed tasks!");
    return;
  }
  if (confirm(`Clear ${count} completed task${count > 1 ? "s" : ""}?`)) {
    todos = todos.filter(t => !t.completed);
    save();
    render();
  }
}

function setFilter(f) {
  const validFilters = ["all", "active", "completed"];
  if (!validFilters.includes(f)) return;
  filter = f;
  $$(".filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === f);
  });
  try {
    localStorage.setItem("filter", f);
  } catch (e) {
    console.warn("Could not save filter to localStorage:", e);
  }
  render();
}

function init() {
  loadData();
  
  const addBtn = $("add-btn");
  const todoInput = $("todo-input");
  const clearCompletedBtn = $("clear-completed");
  const saveEditBtn = $("save-edit");
  const cancelEditBtn = $("cancel-edit");
  const editInput = $("edit-input");
  const editModal = $("edit-modal");
  const themeToggle = $("theme-toggle");

  if (addBtn) addBtn.onclick = add;
  if (todoInput) {
    todoInput.onkeydown = (e) => {
      if (e.key === "Enter") add();
    };
  }
  
  $$(".filter-btn").forEach(btn => {
    btn.onclick = () => setFilter(btn.dataset.filter);
  });
  
  if (clearCompletedBtn) clearCompletedBtn.onclick = clearCompleted;
  if (saveEditBtn) saveEditBtn.onclick = saveEdit;
  if (cancelEditBtn) cancelEditBtn.onclick = closeEdit;
  
  if (editInput) {
    editInput.onkeydown = (e) => {
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") closeEdit();
    };
  }
  
  if (editModal) {
    editModal.onclick = (e) => {
      if (e.target === editModal) closeEdit();
    };
  }
  
  if (themeToggle) {
    themeToggle.onclick = () => {
      setTheme(theme === "light" ? "dark" : "light");
    };
  }

  setTheme(theme);
  setFilter(filter);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
