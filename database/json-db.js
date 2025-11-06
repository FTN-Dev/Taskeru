const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data.json');

class JsonDB {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        try {
            if (fs.existsSync(dbPath)) {
                const rawData = fs.readFileSync(dbPath, 'utf8');
                return JSON.parse(rawData);
            }
        } catch (error) {
            console.error('Error loading database:', error);
        }
        
        // Default data structure
        return {
            users: [],
            projects: [{ id: "inbox", name: "Inbox", builtin: true }],
            tasks: [],
            prefs: { theme: "dark", lastTab: "all" }
        };
    }

    save() {
        try {
            fs.writeFileSync(dbPath, JSON.stringify(this.data, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving database:', error);
            return false;
        }
    }

    // User methods
    findUserByUsername(username) {
        return this.data.users.find(u => u.username === username);
    }

    findUserByEmail(email) {
        return this.data.users.find(u => u.email === email);
    }

    addUser(user) {
        this.data.users.push({
            id: Date.now().toString(),
            ...user,
            created_at: new Date().toISOString()
        });
        return this.save();
    }

    // Task methods
    getTasks() {
        return this.data.tasks;
    }

    addTask(task) {
        this.data.tasks.push(task);
        return this.save();
    }

    updateTask(taskId, updates) {
        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.data.tasks[taskIndex] = { ...this.data.tasks[taskIndex], ...updates };
            return this.save();
        }
        return false;
    }

    deleteTask(taskId) {
        const taskIndex = this.data.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.data.tasks.splice(taskIndex, 1);
            return this.save();
        }
        return false;
    }

    // Project methods
    getProjects() {
        return this.data.projects;
    }

    addProject(project) {
        this.data.projects.push(project);
        return this.save();
    }

    deleteProject(projectId) {
        const projectIndex = this.data.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1 && !this.data.projects[projectIndex].builtin) {
            this.data.projects.splice(projectIndex, 1);
            // Move tasks to inbox
            this.data.tasks.forEach(task => {
                if (task.project === projectId) {
                    task.project = 'inbox';
                }
            });
            return this.save();
        }
        return false;
    }
}

module.exports = new JsonDB();