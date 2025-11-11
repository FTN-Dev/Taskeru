/* ========= Data Layer ========= */
const db = {
  tasks: [],
  projects: [{ id: "inbox", name: "Inbox", builtin: true }],
  prefs: { theme: "dark", lastTab: "all" }
};

// Load data dari server
async function load() {
  if (!checkAuth()) return;
  
  try {
    // Load preferences dari localStorage
    const prefs = localStorage.getItem('taskeru_prefs');
    if (prefs) {
      db.prefs = { ...db.prefs, ...JSON.parse(prefs) };
    }
    
    // Load tasks dari localStorage sebagai fallback
    const savedTasks = localStorage.getItem('taskeru_tasks');
    if (savedTasks) {
      db.tasks = JSON.parse(savedTasks);
    }
    
  } catch (e) {
    console.warn("Failed to load from server:", e);
  }
}

// Save data ke server
async function save() {
  try {
    // Simpan preferences dan tasks ke localStorage
    localStorage.setItem('taskeru_prefs', JSON.stringify(db.prefs));
    localStorage.setItem('taskeru_tasks', JSON.stringify(db.tasks));
    console.log('💾 Saved data to localStorage');
  } catch (e) {
    console.warn("Failed to save data:", e);
  }
}

// Helper functions
function uid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
function todayStr() { return new Date().toISOString().slice(0,10); }
function offsetDate(days) {
  const d = new Date(); 
  d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}

function makeTask(title, opts={}) {
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
    updatedAt: opts.updatedAt || Date.now()
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
  taskItemTemplate: document.getElementById("taskItemTemplate")
};

/* ========= Auth Helpers ========= */
function getCurrentUser() {
    const user = localStorage.getItem('taskeru_user');
    return user ? JSON.parse(user) : null;
}

function checkAuth() {
    return true;
}

/* ========= State ========= */
let state = {
  tab: "all",
  query: "",
  sort: "created_desc",
  group: "none",
  filterHigh: false,
  filterOverdue: false
};

/* ========= Init ========= */
function init() {
  console.log('🚀 Initializing Taskeru...');
  
  load().then(() => {
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
  }).catch(error => {
    console.error('❌ Initialization error:', error);
  });
}

/* ========= Rendering ========= */
function renderProjects() {
  // fill project select in modal
  els.taskProject.innerHTML = "";
  db.projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name + (p.builtin ? " (default)" : "");
    els.taskProject.appendChild(opt);
  });
  
  // sidebar list
  els.projectList.innerHTML = "";
  db.projects.forEach(p => {
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
        if (db.tasks.some(t => t.project === p.id)) {
          if (!confirm("Project berisi tugas. Hapus project akan memindahkan tugas ke Inbox. Lanjut?")) return;
          db.tasks.forEach(t => { if (t.project === p.id) t.project = "inbox"; });
        }
        db.projects = db.projects.filter(x => x.id !== p.id);
        save(); renderProjects(); renderAll();
      });
      const wrap = document.createElement("div");
      wrap.style.display="flex"; wrap.style.gap="6px";
      wrap.appendChild(btn); wrap.appendChild(del);
      li.appendChild(wrap);
    } else {
      li.appendChild(btn);
    }
    els.projectList.appendChild(li);
  });
}

function renderAll() {
  console.log("Rendering tasks:", db.tasks);
  
  // Tabs active state & title
  els.tabs.forEach(b => b.classList.toggle("active", b.dataset.tab === state.tab));
  const titles = { all:"All Tasks", today:"Today", upcoming:"Upcoming", completed:"Completed" };
  els.viewTitle.textContent = titles[state.tab] || "Tasks";

  // Filter pipeline
  let items = db.tasks.slice();

  // tab filters
  const today = todayStr();
  if (state.tab === "today") items = items.filter(t => (t.due || "") === today && !t.completed);
  if (state.tab === "upcoming") items = items.filter(t => (t.due || "") > today && !t.completed);
  if (state.tab === "completed") items = items.filter(t => t.completed);
  if (state.tab === "all") items = items;

  // quick filters
  if (state.filterHigh) items = items.filter(t => t.priority === 3);
  if (state.filterOverdue) items = items.filter(t => (t.due && t.due < today) && !t.completed);

  // search / query: support "project:ID" and plain text
  const q = (state.query || "").trim().toLowerCase();
  if (q) {
    if (q.startsWith("project:")) {
      const pid = q.split(":")[1];
      items = items.filter(t => t.project === pid);
    } else {
      items = items.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.desc && t.desc.toLowerCase().includes(q))
      );
    }
  }

  // sort
  items.sort((a,b)=>{
    switch(state.sort){
      case "created_desc": return b.createdAt - a.createdAt;
      case "created_asc": return a.createdAt - b.createdAt;
      case "due_asc": return (a.due||"9999-12-31").localeCompare(b.due||"9999-12-31");
      case "due_desc": return (b.due||"0000-01-01").localeCompare(a.due||"0000-01-01");
      case "priority_desc": return b.priority - a.priority;
      case "priority_asc": return a.priority - b.priority;
      default: return 0;
    }
  });

  // group
  const groups = groupItems(items, state.group);

  // render
  els.taskContainer.innerHTML = "";
  const hasAny = items.length > 0;
  els.emptyState.hidden = hasAny;
  els.taskContainer.hidden = !hasAny;

  if (Object.keys(groups).length === 0 && hasAny) {
    // If no groups, create a default one
    groups["Tasks"] = items;
  }

  Object.entries(groups).forEach(([label, arr])=>{
    const group = document.createElement("div");
    group.className = "group" + (arr.length===0 ? " empty":"");
    const header = document.createElement("header");
    header.innerHTML = `<span>${label}</span><span>${arr.length} item</span>`;
    const list = document.createElement("div");
    list.className = "list";
    
    if (arr.length === 0) {
      list.textContent = "Tidak ada tugas pada grup ini.";
      list.style.maxHeight = "none";
      list.style.overflow = "visible";
    } else {
      list.style.maxHeight = "400px";
      list.style.overflowY = "auto";
      arr.forEach(task => list.appendChild(renderTask(task)));
    }
    
    group.appendChild(header); 
    group.appendChild(list);
    els.taskContainer.appendChild(group);
  });

  updateStats();
}

function groupItems(items, mode){
  if (mode === "none") return { "Tasks": items };
  const map = {};
  
  const ensure = (k)=> {
    if (!map[k]) map[k] = [];
    return map[k];
  };
  
  if (mode === "project") {
    items.forEach(t=>{
      const p = db.projects.find(x=>x.id===t.project);
      ensure(p ? p.name : "Unknown").push(t);
    });
  } else if (mode === "priority") {
    const label = p => p===3?"High":p===2?"Normal":"Low";
    items.forEach(t=> ensure(label(t.priority)).push(t));
  } else if (mode === "due") {
    const label = (d)=>{
      if (!d) return "No due date";
      const today = todayStr();
      if (d < today) return "Overdue";
      if (d === today) return "Today";
      return d;
    };
    items.forEach(t=> ensure(label(t.due)).push(t));
  }
  
  return map;
}

function renderTask(t){
  const tpl = els.taskItemTemplate.content.firstElementChild.cloneNode(true);
  const root = tpl;
  if (t.completed) root.classList.add("completed");

  const cb  = root.querySelector(".checkBox");
  const title = root.querySelector(".title");
  const badge = root.querySelector(".badge.priority");
  const due = root.querySelector(".due");
  const project = root.querySelector(".project");
  const editBtn = root.querySelector(".editBtn");
  const delBtn = root.querySelector(".delBtn");

  // complete checkbox
  cb.checked = t.completed;
  cb.addEventListener("change", async ()=>{
    t.completed = cb.checked;
    t.updatedAt = Date.now();
    
    try {
      await save();
      renderAll();
    } catch (error) {
      console.error('Error updating task completion:', error);
      // Rollback visual
      cb.checked = !t.completed;
      t.completed = !t.completed;
    }
  });

  // title + badge
  title.textContent = t.title || "Untitled Task";
  badge.textContent = t.priority===3?"High":t.priority===2?"Normal":"Low";
  badge.classList.add(`p${t.priority}`);

  // subline
  due.textContent = t.due ? `Due ${formatDate(t.due)}` : "No due";
  const projectName = db.projects.find(p=>p.id===t.project)?.name || "Unknown";
  project.textContent = projectName;

  // edit/delete
  editBtn.addEventListener("click", ()=> openTaskModal(t));
  delBtn.addEventListener("click", ()=> deleteTask(t.id));

  return root;
}

/* ========= Events & Modals ========= */
function wireEvents(){
  console.log('🔌 Wiring events...');
  
  // tabs
  els.tabs.forEach(b=>{
    b.addEventListener("click", ()=>{
      state.tab = b.dataset.tab;
      db.prefs.lastTab = state.tab; 
      save();
      renderAll();
    });
  });

  // search
  els.searchInput.addEventListener("input", debounce((e)=>{
    state.query = e.target.value;
    renderAll();
  }, 300));

  // sort/group
  els.sortSelect.addEventListener("change", e=>{ 
    state.sort = e.target.value; 
    renderAll(); 
  });
  els.groupSelect.addEventListener("change", e=>{ 
    state.group = e.target.value; 
    renderAll(); 
  });

  // quick filters
  els.filterHigh.addEventListener("change", e=>{ 
    state.filterHigh = e.target.checked; 
    renderAll(); 
  });
  els.filterOverdue.addEventListener("change", e=>{ 
    state.filterOverdue = e.target.checked; 
    renderAll(); 
  });

  // add task - FIXED: Pastikan event listener terpasang
  els.addTaskBtn.addEventListener("click", ()=> {
    console.log('➕ Add task button clicked');
    openTaskModal();
  });
  
  els.ctaAddTask.addEventListener("click", ()=> {
    console.log('➕ CTA Add task button clicked');
    openTaskModal();
  });

  // keyboard shortcuts
  window.addEventListener("keydown", (e)=>{
    if (e.target.matches("input, textarea, select")) return;
    if (e.key.toLowerCase()==="n" && !e.ctrlKey){ 
      e.preventDefault();
      openTaskModal(); 
    }
    if (e.key==="/"){ 
      e.preventDefault(); 
      els.searchInput.focus(); 
    }
  });

  // task modal - FIXED: Pastikan form submit handler terpasang
  els.taskCancel.addEventListener("click", ()=> {
    console.log('❌ Task modal canceled');
    els.taskModal.close();
  });
  
  els.taskForm.addEventListener("submit", (e) => {
    console.log('💾 Task form submitted');
    onTaskSave(e);
  });

  // project modal
  els.addProjectBtn.addEventListener("click", ()=> openProjectModal());
  els.projectCancel.addEventListener("click", ()=> els.projectModal.close());
  els.projectForm.addEventListener("submit", onProjectSave);

  // clear completed
  els.clearCompleted.addEventListener("click", ()=>{
    const before = db.tasks.length;
    db.tasks = db.tasks.filter(t=>!t.completed);
    if (db.tasks.length !== before) save();
    renderAll();
  });

  // theme
  els.toggleTheme.addEventListener("click", ()=>{
    const next = (db.prefs.theme==="dark") ? "light" : "dark";
    applyTheme(next); 
    db.prefs.theme = next; 
    save();
  });

  // sidebar mobile
  els.sidebarToggle.addEventListener("click", ()=>{
    els.sidebar.classList.toggle("open");
  });

  // sidebar close
  const sidebarClose = document.getElementById("sidebarClose");
  if (sidebarClose) {
    sidebarClose.addEventListener("click", () => {
      els.sidebar.classList.remove("open");
    });
  }

  // Close sidebar when clicking outside (mobile)
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 900 && 
        !els.sidebar.contains(e.target) && 
        !els.sidebarToggle.contains(e.target)) {
      els.sidebar.classList.remove("open");
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.close();
      }
    });
  });

  console.log('✅ All events wired successfully');
}

function updateStats(){
  const total = db.tasks.length;
  const done = db.tasks.filter(t=>t.completed).length;
  const left = total - done;
  const overdue = db.tasks.filter(t => t.due && t.due < todayStr() && !t.completed).length;
  
  let stats = `${total} total • ${done} selesai • ${left} tersisa`;
  if (overdue > 0) {
    stats += ` • ${overdue} overdue`;
  }
  
  els.statsText.textContent = stats;
}

function openTaskModal(task=null){
  console.log('🎯 Opening task modal...');
  
  // fill projects select
  renderProjects();

  if (task){
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
    // Set default due date kosong
    els.taskDue.value = "";
    els.taskPriority.value = "2";
    els.taskProject.value = "inbox";
  }
  
  // FIXED: Gunakan showModal() dengan benar
  console.log('📋 Showing modal...');
  els.taskModal.showModal();
  
  setTimeout(()=> {
    els.taskTitle.focus();
    console.log('🎯 Focused on task title');
  }, 100);
}

async function onTaskSave(e){
  e.preventDefault();
  console.log('💾 Saving task...');
  
  const payload = {
    title: els.taskTitle.value,
    desc: els.taskDesc.value,
    due: els.taskDue.value,
    priority: Number(els.taskPriority.value),
    project: els.taskProject.value
  };
  
  const id = els.taskId.value;
  
  if (!payload.title.trim()) {
    alert("Judul tugas tidak boleh kosong!");
    return;
  }

  console.log('📤 Saving task:', { id, payload });

  try {
    if (id){
      // Update existing task
      const t = db.tasks.find(x=>x.id===id);
      if (t){
        Object.assign(t, payload, { updatedAt: Date.now() });
        console.log('✅ Task updated:', t.id);
      }
    } else {
      // Create new task
      const newTask = makeTask(payload.title, payload);
      db.tasks.push(newTask);
      console.log('✅ Task created:', newTask.id);
    }
    
    els.taskModal.close();
    await save();
    renderAll();
    
  } catch (error) {
    console.error('❌ Error saving task:', error);
    alert('Gagal menyimpan task: ' + error.message);
  }
}

function openProjectModal(){
  els.projectName.value = "";
  els.projectModal.showModal();
  setTimeout(()=> els.projectName.focus(), 0);
}

async function onProjectSave(e){
  e.preventDefault();
  const name = els.projectName.value.trim();
  if (!name) {
    alert("Nama project tidak boleh kosong!");
    return;
  }
  
  // Check if project already exists
  if (db.projects.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    alert("Project dengan nama tersebut sudah ada!");
    return;
  }
  
  try {
    const newProject = { id: uid(), name };
    db.projects.push(newProject);
    save();
    renderProjects();
    els.projectModal.close();
    
  } catch (error) {
    console.error('Error creating project:', error);
    alert('Gagal membuat project: ' + error.message);
  }
}

async function deleteTask(taskId) {
  if (!confirm("Hapus tugas ini?")) return;
  
  console.log('🗑 Deleting task:', taskId);
  
  try {
    // Remove from local data
    db.tasks = db.tasks.filter(x => x.id !== taskId);
    
    console.log('✅ Task deleted:', taskId);
    
    await save();
    renderAll();
    
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    alert('Gagal menghapus task: ' + error.message);
  }
}

/* ========= Helpers ========= */
function applyTheme(mode){
  if (mode === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short' 
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
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM loaded, initializing app...');
  
  // Skip authentication untuk development
  const user = JSON.parse(localStorage.getItem('taskeru_user'));
  if (!user && document.querySelector('.app')) {
    window.location.href = '/login.html';
    return;
  }
  
  // Handle logout
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('taskeru_user');
      localStorage.removeItem('taskeru_token');
      localStorage.removeItem('taskeru_prefs');
      localStorage.removeItem('taskeru_tasks');
      window.location.href = '/login.html';
    });
  }

  // Only initialize if we're on the dashboard page
  if (document.querySelector('.app')) {
    console.log('🏠 Dashboard page detected, starting init...');
    init();
  } else {
    console.log('❓ Not on dashboard page, skipping init');
  }
});