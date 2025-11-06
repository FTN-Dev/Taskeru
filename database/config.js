const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'taskeru.db');

async function initializeDatabase() {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });
    
    console.log('Connected to SQLite database');
    return db;
}

module.exports = initializeDatabase;