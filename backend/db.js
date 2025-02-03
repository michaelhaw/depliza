const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database("database.db");

// 🔹 Ensure a clean database every build
db.exec("DROP TABLE IF EXISTS users;");
db.exec("DROP TABLE IF EXISTS ai_agent;");

// 🔹 Create users table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// 🔹 Create AI Agent config table (Singleton)
db.exec(`
  CREATE TABLE ai_agent (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    agent_name TEXT NOT NULL,
    personality TEXT NOT NULL,
    appearance TEXT NOT NULL,
    body_type TEXT NOT NULL,
    occupation TEXT NOT NULL,
    llm_model TEXT NOT NULL,
    llm_api_key TEXT DEFAULT '',
    fal_api_key TEXT DEFAULT '',
    telegram_token TEXT DEFAULT '',
    twitter_username TEXT DEFAULT '',
    twitter_password TEXT DEFAULT '',
    twitter_email TEXT DEFAULT '',
    deployed_at TEXT DEFAULT NULL
  );
`);

// 🔹 Function to seed a default admin user
function seedDefaultUser() {
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "degenwaifu";

  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
    defaultUsername,
    hashedPassword
  );
  console.log(`🚀 Default admin user created: ${defaultUsername}`);
}

// 🔹 Function to seed a default AI agent
function seedDefaultAgent() {
  console.log("⚠️ Seeding default AI agent...");

  const insertAgent = db.prepare(`
    INSERT INTO ai_agent (
      id, agent_name, personality, appearance, body_type, occupation,
      llm_model, llm_api_key, fal_api_key, telegram_token,
      twitter_username, twitter_password, twitter_email, deployed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `);

  insertAgent.run(
    1,
    "MainAgent", // Default AI agent name
    "sweet_caring", // Default personality
    "blonde", // Default appearance
    "slim", // Default body type
    "graphics_designer", // Default occupation
    "openai", // Default LLM model
    "", // llm_api_key (empty initially)
    "", // fal_api_key (empty initially)
    "", // telegram_token (empty)
    "", // twitter_username (empty)
    "", // twitter_password (empty)
    "" // twitter_email (empty)
  );

  console.log("✅ Default AI agent created successfully.");
}

// 🔹 Run seed functions
seedDefaultUser();
//seedDefaultAgent();

module.exports = db;
