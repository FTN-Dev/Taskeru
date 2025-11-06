const initializeDatabase = require('./config');

async function setupDatabase() {
    try {
        console.log('Setting up SQLite database...');
        const db = await initializeDatabase();

        // Create users table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create projects table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(20) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                builtin BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create tasks table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR(20) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                due_date DATE,
                priority INTEGER DEFAULT 2,
                project_id VARCHAR(20) DEFAULT 'inbox',
                completed BOOLEAN DEFAULT 0,
                created_at INTEGER,
                updated_at INTEGER,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        `);

        // Insert default project
        await db.run(`
            INSERT OR IGNORE INTO projects (id, name, builtin) 
            VALUES ('inbox', 'Inbox', 1)
        `);

        console.log('✅ SQLite database setup completed successfully');
        
        await db.close();
    } catch (error) {
        console.error('❌ Database setup error:', error);
    }
}

// Only run if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;