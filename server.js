const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session setup
app.use(session({
  secret: "taskeru-secret-session-key-2024",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Database file path
const dbPath = path.join(__dirname, "data", "database.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper function to read database
function readDatabase() {
  try {
    if (!fs.existsSync(dbPath)) {
      // Initialize with default data
      const defaultData = {
        users: [],
        projects: [
          { id: "inbox", name: "Inbox", builtin: true, createdAt: Date.now() }
        ],
        tasks: [],
        prefs: { theme: "dark", lastTab: "all" }
      };
      writeDatabase(defaultData);
      return defaultData;
    }
    
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return {
      users: [],
      projects: [
        { id: "inbox", name: "Inbox", builtin: true, createdAt: Date.now() }
      ],
      tasks: [],
      prefs: { theme: "dark", lastTab: "all" }
    };
  }
}

// Helper function to write database
function writeDatabase(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
}

// Helper function to generate ID
function generateId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Redirect root → register
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Dashboard (protected route)
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

// Register process
app.post("/register", (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.redirect("/register.html?error=Semua%20field%20harus%20diisi");
    }
    
    const db = readDatabase();
    
    // Check if user already exists
    const existingUser = db.users.find(u => 
      u.username === username || u.email === email
    );
    
    if (existingUser) {
      return res.redirect("/register.html?error=Username%20atau%20Email%20sudah%20digunakan");
    }
    
    // Add new user
    const newUser = {
      id: generateId(),
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDatabase(db);
    
    return res.redirect("/login.html?success=Registrasi%20berhasil!%20Silakan%20login.");
  } catch (error) {
    console.error('Registration error:', error);
    return res.redirect("/register.html?error=Error%20server");
  }
});

// Login process
app.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.redirect("/login.html?error=Username%20dan%20password%20harus%20diisi");
    }
    
    const db = readDatabase();
    
    // Find user
    const user = db.users.find(u => u.username === username);
    
    if (!user) {
      return res.redirect("/login.html?error=Username%20tidak%20ditemukan");
    }
    
    // Check password
    if (user.password !== password) {
      return res.redirect("/login.html?error=Password%20salah");
    }
    
    // Set session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };
    
    res.redirect("/dashboard");
  } catch (error) {
    console.error('Login error:', error);
    return res.redirect("/login.html?error=Error%20server");
  }
});

// API Routes untuk tasks

// Get all tasks for logged in user
app.get("/api/tasks", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const db = readDatabase();
    res.json(db.tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new task
app.post("/api/tasks", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const { title, desc, due, priority, project } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Task title is required" });
    }
    
    const db = readDatabase();
    
    const newTask = {
      id: generateId(),
      title: title.trim(),
      desc: (desc || "").trim(),
      due: due || "",
      priority: Number(priority || 2),
      project: project || "inbox",
      completed: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    db.tasks.push(newTask);
    writeDatabase(db);
    
    res.json({ success: true, id: newTask.id, task: newTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update task
app.put("/api/tasks/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const taskId = req.params.id;
    const { title, desc, due, priority, project, completed } = req.body;
    
    const db = readDatabase();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    // Update task
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      title: title || db.tasks[taskIndex].title,
      desc: desc !== undefined ? desc : db.tasks[taskIndex].desc,
      due: due !== undefined ? due : db.tasks[taskIndex].due,
      priority: priority !== undefined ? Number(priority) : db.tasks[taskIndex].priority,
      project: project || db.tasks[taskIndex].project,
      completed: completed !== undefined ? Boolean(completed) : db.tasks[taskIndex].completed,
      updatedAt: Date.now()
    };
    
    writeDatabase(db);
    
    res.json({ success: true, task: db.tasks[taskIndex] });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete task
app.delete("/api/tasks/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const taskId = req.params.id;
    
    const db = readDatabase();
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    db.tasks.splice(taskIndex, 1);
    writeDatabase(db);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Projects API

// Get all projects
app.get("/api/projects", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const db = readDatabase();
    res.json(db.projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new project
app.post("/api/projects", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }
    
    const db = readDatabase();
    
    // Check if project already exists
    const existingProject = db.projects.find(p => 
      p.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (existingProject) {
      return res.status(400).json({ error: "Project with this name already exists" });
    }
    
    const newProject = {
      id: generateId(),
      name: name.trim(),
      builtin: false,
      createdAt: Date.now()
    };
    
    db.projects.push(newProject);
    writeDatabase(db);
    
    res.json({ success: true, id: newProject.id, project: newProject });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete project
app.delete("/api/projects/:id", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const projectId = req.params.id;
    
    const db = readDatabase();
    const projectIndex = db.projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const project = db.projects[projectIndex];
    
    // Prevent deletion of built-in projects
    if (project.builtin) {
      return res.status(400).json({ error: "Cannot delete built-in project" });
    }
    
    // Move tasks to inbox
    db.tasks.forEach(task => {
      if (task.project === projectId) {
        task.project = "inbox";
        task.updatedAt = Date.now();
      }
    });
    
    // Remove project
    db.projects.splice(projectIndex, 1);
    writeDatabase(db);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user preferences
app.get("/api/prefs", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const db = readDatabase();
    res.json(db.prefs || { theme: "dark", lastTab: "all" });
  } catch (error) {
    console.error('Get prefs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user preferences
app.put("/api/prefs", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const { theme, lastTab } = req.body;
    
    const db = readDatabase();
    db.prefs = {
      ...db.prefs,
      theme: theme || db.prefs?.theme || "dark",
      lastTab: lastTab || db.prefs?.lastTab || "all"
    };
    
    writeDatabase(db);
    
    res.json({ success: true, prefs: db.prefs });
  } catch (error) {
    console.error('Update prefs error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect("/login");
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Taskeru running at http://localhost:${PORT}`);
  console.log(`📁 Database file: ${dbPath}`);
});