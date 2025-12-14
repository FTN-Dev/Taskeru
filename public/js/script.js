/* ========= Data Layer ========= */
const db = {
  tasks: [],
  projects: [{ id: "inbox", name: "Inbox", builtin: true }],
  prefs: { theme: "dark", lastTab: "all" },
};

// Load data dari server
// async function load() {
//   if (!checkAuth()) return;

//   try {
//     const [tasksRes, projectsRes] = await Promise.all([
//       fetch('/api/tasks', { headers: getAuthHeaders() }),
//       fetch('/api/projects', { headers: getAuthHeaders() })
//     ]);

//     if (tasksRes.ok) {
//       const tasksData = await tasksRes.json();
//       db.tasks = tasksData;
//       console.log('✅ Loaded tasks from server:', tasksData.length);
//     } else if (tasksRes.status === 401) {
//       window.location.href = '/login.html';
//       return;
//     } else {
//       console.warn('Failed to load tasks, using local data');
//     }

//     if (projectsRes.ok) {
//       const serverProjects = await projectsRes.json();
//       db.projects = [
//         { id: "inbox", name: "Inbox", builtin: true },
//         ...serverProjects.filter(p => !p.builtin)
//       ];
//     }

//     // Load preferences dari localStorage
//     const prefs = localStorage.getItem('taskeru_prefs');
//     if (prefs) {
//       db.prefs = { ...db.prefs, ...JSON.parse(prefs) };
//     }

//   } catch (e) {
//     console.warn("Failed to load from server:", e);
//     // Fallback ke data dummy untuk testing
//     if (db.tasks.length === 0) {
//       db.tasks = [
//         makeTask("Contoh tugas pertama", { due: todayStr(), priority: 2 }),
//         makeTask("Tugas penting", { due: offsetDate(1), priority: 3, project: "inbox" })
//       ];
//     }
//   }
// }

async function load() {
  if (!checkAuth()) return;

  try {
    console.log("🔍 Loading data from server...");

    const [tasksRes, projectsRes] = await Promise.all([
      fetch("/api/tasks", { headers: getAuthHeaders() }),
      fetch("/api/projects", { headers: getAuthHeaders() }),
    ]);

    console.log("📡 Tasks response status:", tasksRes.status);
    console.log("📡 Projects response status:", projectsRes.status);

    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      console.log("✅ Loaded tasks from server:", tasksData);
      db.tasks = tasksData;
    } else {
      console.error(
        "❌ Failed to load tasks:",
        tasksRes.status,
        await tasksRes.text()
      );
      // Fallback untuk development
      db.tasks = getDummyTasks();
    }

    if (projectsRes.ok) {
      const serverProjects = await projectsRes.json();
      db.projects = [
        { id: "inbox", name: "Inbox", builtin: true },
        ...serverProjects.filter((p) => !p.builtin),
      ];
      console.log("✅ Loaded projects:", db.projects);
    } else {
      console.error("❌ Failed to load projects");
      db.projects = [{ id: "inbox", name: "Inbox", builtin: true }];
    }
  } catch (e) {
    console.error("💥 Load error:", e);
    db.tasks = getDummyTasks();
    db.projects = [{ id: "inbox", name: "Inbox", builtin: true }];
  }

  // Load preferences
  const prefs = localStorage.getItem("taskeru_prefs");
  if (prefs) {
    db.prefs = { ...db.prefs, ...JSON.parse(prefs) };
  }

  console.log("🎯 Final data state:", {
    tasks: db.tasks,
    projects: db.projects,
    prefs: db.prefs,
  });
}

function getDummyTasks() {
  return [
    makeTask("Contoh tugas pertama", {
      due: todayStr(),
      priority: 2,
      desc: "Ini adalah contoh tugas pertama",
    }),
    makeTask("Tugas penting", {
      due: offsetDate(1),
      priority: 3,
      project: "inbox",
      desc: "Ini adalah tugas penting dengan prioritas tinggi",
    }),
    makeTask("Tugas selesai", {
      due: offsetDate(-1),
      priority: 1,
      completed: true,
      desc: "Tugas ini sudah selesai",
    }),
  ];
}

// Save data ke server
async function save() {
  try {
    // Simpan preferences ke localStorage
    localStorage.setItem("taskeru_prefs", JSON.stringify(db.prefs));
    console.log("💾 Saved preferences to localStorage");
  } catch (e) {
    console.warn("Failed to save preferences:", e);
  }
}

// Helper functions
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function makeTask(title, opts = {}) {
  const taskId = opts.id || uid();
  return {
    id: taskId,
    title: title.trim(),
    desc: (opts.desc || "").trim(),
    due: opts.due || "",
    priority: Number(opts.priority || 2),
    project: opts.project || "inbox",
    completed: !!opts.completed,
    createdAt: opts.createdAt || Date.now(),
    updatedAt: opts.updatedAt || Date.now(),
  };
}

/* ========= DOM refs ========= */
const els = {
  sidebar: document.querySelector(".sidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  addProjectBtn: document.getElementById("addProjectBtn"),
  projectList: document.getElementById("projectList"),
  toggleTheme: document.getElementById("toggleTheme"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  groupSelect: document.getElementById("groupSelect"),
  addTaskBtn: document.getElementById("addTaskBtn"),
  ctaAddTask: document.getElementById("ctaAddTask"),
  viewTitle: document.getElementById("viewTitle"),
  taskContainer: document.getElementById("taskContainer"),
  emptyState: document.getElementById("emptyState"),
  clearCompleted: document.getElementById("clearCompleted"),
  filterHigh: document.getElementById("filterHigh"),
  filterOverdue: document.getElementById("filterOverdue"),
  statsText: document.getElementById("statsText"),
  // tabs
  tabs: Array.from(document.querySelectorAll(".tab")),
  // modal: task
  taskModal: document.getElementById("taskModal"),
  taskForm: document.getElementById("taskForm"),
  taskModalTitle: document.getElementById("taskModalTitle"),
  taskTitle: document.getElementById("taskTitle"),
  taskDesc: document.getElementById("taskDesc"),
  taskDue: document.getElementById("taskDue"),
  taskPriority: document.getElementById("taskPriority"),
  taskProject: document.getElementById("taskProject"),
  taskCancel: document.getElementById("taskCancel"),
  taskSave: document.getElementById("taskSave"),
  taskId: document.getElementById("taskId"),
  // modal: project
  projectModal: document.getElementById("projectModal"),
  projectForm: document.getElementById("projectForm"),
  projectName: document.getElementById("projectName"),
  projectCancel: document.getElementById("projectCancel"),
  projectSave: document.getElementById("projectSave"),
  // template
  taskItemTemplate: document.getElementById("taskItemTemplate"),
};

/* ========= Auth Helpers ========= */
function getCurrentUser() {
  const user = localStorage.getItem("taskeru_user");
  return user ? JSON.parse(user) : null;
}

// function getAuthHeaders() {
//   const user = getCurrentUser();
//   return {
//     "Content-Type": "application/json",
//     "X-User-Id": user?.id || "",
//   };
// }

function getAuthHeaders() {
  const user = getCurrentUser();
  console.log("🔐 Auth headers for user:", user?.id);
  return {
    "Content-Type": "application/json",
    "X-User-Id": user?.id || "demo-user", // fallback untuk testing
  };
}

function checkAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login.html";
    return false;
  }
  return true;
}

/* ========= State ========= */
let state = {
  tab: "all",
  query: "",
  sort: "created_desc",
  group: "none",
  filterHigh: false,
  filterOverdue: false,
  selection: new Set(), // selected task ids (bulk)
};

/* ========= Init ========= */
function init() {
  console.log("🚀 Initializing Taskeru...");
  console.log("👤 Current user:", getCurrentUser());

  load()
    .then(() => {
      applyTheme(db.prefs.theme || "dark");
      state.tab = db.prefs.lastTab || "all";

      // Set initial values for selects
      els.sortSelect.value = state.sort;
      els.groupSelect.value = state.group;

      renderProjects();
      renderAll();
      wireEvents();
      updateStats();

      console.log("✅ Initialized with tasks:", db.tasks.length);
    })
    .catch((error) => {
      console.error("❌ Initialization error:", error);
    });
}

/* ========= Rendering ========= */
function renderProjects() {
  // fill project select in modal
  els.taskProject.innerHTML = "";
  db.projects.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name + (p.builtin ? " (default)" : "");
    els.taskProject.appendChild(opt);
  });

  // sidebar list
  els.projectList.innerHTML = "";
  db.projects.forEach((p) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "ghost-btn";
    btn.textContent = "View";
    btn.addEventListener("click", () => {
      state.query = `project:${p.id}`;
      els.searchInput.value = state.query;
      renderAll();
    });

    const span = document.createElement("span");
    span.className = "name";
    span.textContent = p.name;
    li.appendChild(span);

    if (!p.builtin) {
      const del = document.createElement("button");
      del.className = "icon-btn";
      del.title = "Delete project";
      del.textContent = "🗑";
      del.addEventListener("click", () => {
        if (db.tasks.some((t) => t.project === p.id)) {
          if (
            !confirm(
              "Project berisi tugas. Hapus project akan memindahkan tugas ke Inbox. Lanjut?"
            )
          )
            return;
          db.tasks.forEach((t) => {
            if (t.project === p.id) t.project = "inbox";
          });
        }
        db.projects = db.projects.filter((x) => x.id !== p.id);
        save();
        renderProjects();
        renderAll();
      });
      const wrap = document.createElement("div");
      wrap.style.display = "flex";
      wrap.style.gap = "6px";
      wrap.appendChild(btn);
      wrap.appendChild(del);
      li.appendChild(wrap);
    } else {
      li.appendChild(btn);
    }
    els.projectList.appendChild(li);
  });
}

// function renderAll() {
//   console.log("Rendering tasks:", db.tasks);

//   // Tabs active state & title
//   els.tabs.forEach((b) =>
//     b.classList.toggle("active", b.dataset.tab === state.tab)
//   );
//   const titles = {
//     all: "All Tasks",
//     today: "Today",
//     upcoming: "Upcoming",
//     completed: "Completed",
//   };
//   els.viewTitle.textContent = titles[state.tab] || "Tasks";

//   // Filter pipeline
//   let items = db.tasks.slice();

//   // tab filters
//   const today = todayStr();
//   if (state.tab === "today")
//     items = items.filter((t) => (t.due || "") === today && !t.completed);
//   if (state.tab === "upcoming")
//     items = items.filter((t) => (t.due || "") > today && !t.completed);
//   if (state.tab === "completed") items = items.filter((t) => t.completed);
//   if (state.tab === "all") items = items;

//   // quick filters
//   if (state.filterHigh) items = items.filter((t) => t.priority === 3);
//   if (state.filterOverdue)
//     items = items.filter((t) => t.due && t.due < today && !t.completed);

//   // search / query: support "project:ID" and plain text
//   const q = (state.query || "").trim().toLowerCase();
//   if (q) {
//     if (q.startsWith("project:")) {
//       const pid = q.split(":")[1];
//       items = items.filter((t) => t.project === pid);
//     } else {
//       items = items.filter(
//         (t) =>
//           t.title.toLowerCase().includes(q) ||
//           (t.desc && t.desc.toLowerCase().includes(q))
//       );
//     }
//   }

//   // sort
//   items.sort((a, b) => {
//     switch (state.sort) {
//       case "created_desc":
//         return b.createdAt - a.createdAt;
//       case "created_asc":
//         return a.createdAt - b.createdAt;
//       case "due_asc":
//         return (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31");
//       case "due_desc":
//         return (b.due || "0000-01-01").localeCompare(a.due || "0000-01-01");
//       case "priority_desc":
//         return b.priority - a.priority;
//       case "priority_asc":
//         return a.priority - b.priority;
//       default:
//         return 0;
//     }
//   });

//   // group
//   const groups = groupItems(items, state.group);

//   // render
//   els.taskContainer.innerHTML = "";
//   const hasAny = items.length > 0;
//   els.emptyState.hidden = hasAny;
//   els.taskContainer.hidden = !hasAny;

//   if (Object.keys(groups).length === 0) {
//     // If no groups, create a default one
//     groups["Tasks"] = items;
//   }

//   Object.entries(groups).forEach(([label, arr]) => {
//     const group = document.createElement("div");
//     group.className = "group" + (arr.length === 0 ? " empty" : "");
//     const header = document.createElement("header");
//     header.innerHTML = `<span>${label}</span><span>${arr.length} item</span>`;
//     const list = document.createElement("div");
//     list.className = "list";

//     if (arr.length === 0) {
//       list.textContent = "Tidak ada tugas pada grup ini.";
//       list.style.maxHeight = "none";
//       list.style.overflow = "visible";
//     } else {
//       list.style.maxHeight = "400px";
//       list.style.overflowY = "auto";
//       arr.forEach((task) => list.appendChild(renderTask(task)));
//     }

//     group.appendChild(header);
//     group.appendChild(list);
//     els.taskContainer.appendChild(group);
//   });

//   // update bulk bar
//   updateBulkBar();
//   updateStats();
// }

function renderAll() {
  console.log("🎨 Rendering tasks. Total:", db.tasks.length);
  console.log("📊 Tasks data:", db.tasks);

  // Tabs active state & title
  els.tabs.forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === state.tab)
  );
  const titles = {
    all: "All Tasks",
    today: "Today",
    upcoming: "Upcoming",
    completed: "Completed",
  };
  els.viewTitle.textContent = titles[state.tab] || "Tasks";

  // Filter pipeline
  let items = db.tasks.slice();
  console.log("📋 Initial items:", items.length);

  // tab filters
  const today = todayStr();
  if (state.tab === "today")
    items = items.filter((t) => (t.due || "") === today && !t.completed);
  if (state.tab === "upcoming")
    items = items.filter((t) => (t.due || "") > today && !t.completed);
  if (state.tab === "completed") items = items.filter((t) => t.completed);
  if (state.tab === "all") items = items;

  // quick filters
  if (state.filterHigh) items = items.filter((t) => t.priority === 3);
  if (state.filterOverdue)
    items = items.filter((t) => t.due && t.due < today && !t.completed);

  // search / query: support "project:ID" and plain text
  const q = (state.query || "").trim().toLowerCase();
  if (q) {
    if (q.startsWith("project:")) {
      const pid = q.split(":")[1];
      items = items.filter((t) => t.project === pid);
    } else {
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.desc && t.desc.toLowerCase().includes(q))
      );
    }
  }

  // sort
  items.sort((a, b) => {
    switch (state.sort) {
      case "created_desc":
        return b.createdAt - a.createdAt;
      case "created_asc":
        return a.createdAt - b.createdAt;
      case "due_asc":
        return (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31");
      case "due_desc":
        return (b.due || "0000-01-01").localeCompare(a.due || "0000-01-01");
      case "priority_desc":
        return b.priority - a.priority;
      case "priority_asc":
        return a.priority - b.priority;
      default:
        return 0;
    }
  });

  console.log("🔍 After filtering:", items.length, "items");

  // group
  const groups = groupItems(items, state.group);
  console.log("📂 Groups:", groups);

  // render
  els.taskContainer.innerHTML = "";
  const hasAny = items.length > 0;
  
  // Explicit display toggle
  els.emptyState.style.display = hasAny ? "none" : "grid";
  els.taskContainer.style.display = hasAny ? "flex" : "none";

  console.log("👀 Empty state visible:", !hasAny);

  if (Object.keys(groups).length === 0) {
    console.log("ℹ️ No groups, creating default");
    groups["Tasks"] = items;
  }

  Object.entries(groups).forEach(([label, arr]) => {
    console.log(`🔄 Rendering group: ${label} with ${arr.length} items`);

    const group = document.createElement("div");
    group.className = "group" + (arr.length === 0 ? " empty" : "");

    const header = document.createElement("header");
    header.innerHTML = `<span>${label}&nbsp;</span><span>${arr.length} item</span>`;

    const wrapper = document.createElement("div");
    wrapper.className = "todo-list";

    const list = document.createElement("ul");
    list.className = "list";

    if (arr.length === 0) {
      list.textContent = "Tidak ada tugas pada grup ini.";
    } else {
      // Removed manual max-height/overflow overrides so CSS handles it
      arr.forEach((task) => {
        console.log("➕ Rendering task:", task.title);
        const taskEl = renderTask(task);
        list.appendChild(taskEl);
      });
    }

    group.appendChild(header);
    wrapper.appendChild(list);
    group.appendChild(wrapper);
    els.taskContainer.appendChild(group);
  });

  updateStats();

  console.log("✅ Render completed");
}

function groupItems(items, mode) {
  if (mode === "none") return { Tasks: items };
  const map = {};

  const ensure = (k) => {
    if (!map[k]) map[k] = [];
    return map[k];
  };

  if (mode === "project") {
    items.forEach((t) => {
      const p = db.projects.find((x) => x.id === t.project);
      ensure(p ? p.name : "Unknown").push(t);
    });
  } else if (mode === "priority") {
    const label = (p) => (p === 3 ? "High" : p === 2 ? "Normal" : "Low");
    items.forEach((t) => ensure(label(t.priority)).push(t));
  } else if (mode === "due") {
    const label = (d) => {
      if (!d) return "No due date";
      const today = todayStr();
      if (d < today) return "Overdue";
      if (d === today) return "Today";
      return d;
    };
    items.forEach((t) => ensure(label(t.due)).push(t));
  }

  return map;
}

function renderTask(t) {
  const tpl = els.taskItemTemplate.content.firstElementChild.cloneNode(true);
  const root = tpl;
  if (t.completed) root.classList.add("completed");

  const cb = root.querySelector(".checkBox");
  const title = root.querySelector(".title");
  const badge = root.querySelector(".badge.priority");
  const due = root.querySelector(".due");
  const project = root.querySelector(".project");
  const editBtn = root.querySelector(".editBtn");
  const delBtn = root.querySelector(".delBtn");

  // complete checkbox
  cb.checked = t.completed;
  cb.addEventListener("change", async () => {
    t.completed = cb.checked;
    t.updatedAt = Date.now();

    try {
      const response = await fetch(`/api/tasks?id=${t.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: t.completed }),
      });

      if (!response.ok) throw new Error("Failed to update task");

      await save();
      renderAll();
    } catch (error) {
      console.error("Error updating task completion:", error);
      // Rollback visual
      cb.checked = !t.completed;
      t.completed = !t.completed;
    }
  });

  // title + badge
  title.textContent = t.title || "Untitled Task";
  badge.textContent =
    t.priority === 3 ? "High" : t.priority === 2 ? "Normal" : "Low";
  badge.classList.add(`p${t.priority}`);

  // subline
  due.textContent = t.due ? `Due ${formatDate(t.due)}` : "No due";
  const projectName =
    db.projects.find((p) => p.id === t.project)?.name || "Unknown";
  project.textContent = projectName;

  // edit/delete
  editBtn.addEventListener("click", () => openTaskModal(t));
  delBtn.addEventListener("click", () => deleteTask(t.id));

  return root;
}

/* ========= Events & Modals ========= */
function wireEvents() {
  // tabs
  els.tabs.forEach((b) => {
    b.addEventListener("click", () => {
      state.tab = b.dataset.tab;
      db.prefs.lastTab = state.tab;
      save();
      renderAll();
    });
  });

  // search
  els.searchInput.addEventListener(
    "input",
    debounce((e) => {
      state.query = e.target.value;
      renderAll();
    }, 300)
  );

  // sort/group
  els.sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderAll();
  });
  els.groupSelect.addEventListener("change", (e) => {
    state.group = e.target.value;
    renderAll();
  });

  // quick filters
  els.filterHigh.addEventListener("change", (e) => {
    state.filterHigh = e.target.checked;
    renderAll();
  });
  els.filterOverdue.addEventListener("change", (e) => {
    state.filterOverdue = e.target.checked;
    renderAll();
  });

  // add task
  els.addTaskBtn.addEventListener("click", () => openTaskModal());
  els.ctaAddTask.addEventListener("click", () => openTaskModal());

  // keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, select")) return;
    if (e.key.toLowerCase() === "n" && !e.ctrlKey) {
      e.preventDefault();
      openTaskModal();
    }
    if (e.key === "/") {
      e.preventDefault();
      els.searchInput.focus();
    }
  });

  // task modal
  els.taskCancel.addEventListener("click", () => els.taskModal.close());
  els.taskForm.addEventListener("submit", onTaskSave);

  // project modal
  els.addProjectBtn.addEventListener("click", () => openProjectModal());
  els.projectCancel.addEventListener("click", () => els.projectModal.close());
  els.projectForm.addEventListener("submit", onProjectSave);

  // clear completed
  els.clearCompleted.addEventListener("click", () => {
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((t) => !t.completed);
    if (db.tasks.length !== before) save();
    renderAll();
  });

  // theme
  els.toggleTheme.addEventListener("click", () => {
    const next = db.prefs.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    db.prefs.theme = next;
    save();
  });

  // sidebar mobile
  els.sidebarToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    els.sidebar.classList.toggle("open");
  });

  // sidebar close
  const sidebarClose = document.getElementById("sidebarClose");
  if (sidebarClose) {
    sidebarClose.addEventListener("click", (e) => {
      e.stopPropagation();
      els.sidebar.classList.remove("open");
    });
  }

  // Close sidebar when clicking outside (mobile)
  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 900 &&
      els.sidebar.classList.contains("open") &&
      !els.sidebar.contains(e.target) &&
      !els.sidebarToggle.contains(e.target)
    ) {
      els.sidebar.classList.remove("open");
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });
  });
}

function updateStats() {
  const total = db.tasks.length;
  const done = db.tasks.filter((t) => t.completed).length;
  const left = total - done;
  const overdue = db.tasks.filter(
    (t) => t.due && t.due < todayStr() && !t.completed
  ).length;

  let stats = `${total} total • ${done} selesai • ${left} tersisa`;
  if (overdue > 0) {
    stats += ` • ${overdue} overdue`;
  }

  els.statsText.textContent = stats;
}

function openTaskModal(task = null) {
  // fill projects select
  renderProjects();

  if (task) {
    els.taskModalTitle.textContent = "Edit Tugas";
    els.taskId.value = task.id;
    els.taskTitle.value = task.title;
    els.taskDesc.value = task.desc || "";
    els.taskDue.value = task.due || "";
    els.taskPriority.value = String(task.priority);
    els.taskProject.value = task.project || "inbox";
  } else {
    els.taskModalTitle.textContent = "Tambah Tugas";
    els.taskId.value = "";
    els.taskTitle.value = "";
    els.taskDesc.value = "";
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    els.taskDue.value = tomorrow.toISOString().split("T")[0];
    els.taskPriority.value = "2";
    els.taskProject.value = "inbox";
  }
  els.taskModal.showModal();
  setTimeout(() => els.taskTitle.focus(), 0);
}

async function onTaskSave(e) {
  e.preventDefault();
  const payload = {
    title: els.taskTitle.value,
    desc: els.taskDesc.value,
    due: els.taskDue.value,
    priority: Number(els.taskPriority.value),
    project: els.taskProject.value,
  };

  const id = els.taskId.value;

  if (!payload.title.trim()) {
    alert("Judul tugas tidak boleh kosong!");
    return;
  }

  console.log("📤 Saving task:", { id, payload });

  try {
    if (id) {
      // Update existing task
      const response = await fetch(`/api/tasks?id=${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update task");
      }

      const result = await response.json();

      // Update local data
      const t = db.tasks.find((x) => x.id === id);
      if (t) {
        Object.assign(t, result.task);
      }

      console.log("✅ Task updated:", result.task.id);
    } else {
      // Create new task
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }

      const result = await response.json();
      const newTask = makeTask(payload.title, result.task);
      db.tasks.push(newTask);

      console.log("✅ Task created:", result.task.id);
    }

    els.taskModal.close();
    await save();
    renderAll();
  } catch (error) {
    console.error("❌ Error saving task:", error);
    alert("Gagal menyimpan task: " + error.message);

    // Fallback ke localStorage untuk testing
    if (id) {
      const t = db.tasks.find((x) => x.id === id);
      if (t) {
        Object.assign(t, payload, { updatedAt: Date.now() });
      }
    } else {
      const newTask = makeTask(payload.title, payload);
      db.tasks.push(newTask);
    }
    await save();
    renderAll();
    els.taskModal.close();
  }
}

function openProjectModal() {
  els.projectName.value = "";
  els.projectModal.showModal();
  setTimeout(() => els.projectName.focus(), 0);
}

async function onProjectSave(e) {
  e.preventDefault();
  const name = els.projectName.value.trim();
  if (!name) {
    alert("Nama project tidak boleh kosong!");
    return;
  }

  // Check if project already exists
  if (db.projects.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    alert("Project dengan nama tersebut sudah ada!");
    return;
  }

  try {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) throw new Error("Failed to create project");

    const result = await response.json();
    db.projects.push({ id: result.id, name });

    renderProjects();
    els.projectModal.close();
  } catch (error) {
    console.error("Error creating project:", error);
    // Fallback to local storage
    const newProject = { id: uid(), name };
    db.projects.push(newProject);
    save();
    renderProjects();
    els.projectModal.close();
  }
}

async function deleteTask(taskId, shouldRender = true) {
  if (!confirm("Hapus tugas ini?")) return;

  console.log("🗑 Deleting task:", taskId);

  try {
    const response = await fetch(`/api/tasks?id=${taskId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete task");
    }

    // Remove from local data
    db.tasks = db.tasks.filter((x) => x.id !== taskId);
    state.selection.delete(taskId);

    console.log("✅ Task deleted:", taskId);

    if (shouldRender) {
      await save();
      renderAll();
    }
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    alert("Gagal menghapus task: " + error.message);

    // Fallback ke localStorage
    db.tasks = db.tasks.filter((x) => x.id !== taskId);
    state.selection.delete(taskId);

    if (shouldRender) {
      await save();
      renderAll();
    }
  }
}

/* ========= Helpers ========= */
function applyTheme(mode) {
  if (mode === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Check authentication on dashboard load
  const user = JSON.parse(localStorage.getItem("taskeru_user"));
  if (!user && document.querySelector(".app")) {
    window.location.href = "/login.html";
    return;
  }

  // Handle logout
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("taskeru_user");
      localStorage.removeItem("taskeru_token");
      localStorage.removeItem("taskeru_prefs");
      window.location.href = "/login.html";
    });
  }

  // Only initialize if we're on the dashboard page
  if (document.querySelector(".app")) {
    init();
  }
});
