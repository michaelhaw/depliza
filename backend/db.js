const Database = require("better-sqlite3");

// Initialize SQLite database
const db = new Database("./database.sqlite", { verbose: console.log });

// Create tables if they don’t exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS deployed_agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    agent_name TEXT NOT NULL,
    app_name TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE (user_id, agent_name) -- Enforce unique agent_name per user_id
  )
`);

module.exports = db;
