require("dotenv").config({ path: process.env.DOTENV_PATH || ".env" });
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database("database.db");

// 🔹 Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );
`);

// 🔹 Create AI Agent config table (Singleton Config File)
db.exec(`
  CREATE TABLE IF NOT EXISTS agent_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    openai_api_key TEXT DEFAULT NULL,
    fal_api_key TEXT DEFAULT NULL,
    telegram_token TEXT DEFAULT NULL,
    telegram_enabled BOOLEAN DEFAULT FALSE,
    twitter_username TEXT DEFAULT NULL,
    twitter_password TEXT DEFAULT NULL,
    twitter_email TEXT DEFAULT NULL,
    twitter_enabled BOOLEAN DEFAULT FALSE,
    first_run BOOLEAN DEFAULT TRUE
  );
`);

// 🔹 Ensure an Entry Always Exists
const existingConfig = db
  .prepare("SELECT COUNT(*) AS count FROM agent_config")
  .get();
if (existingConfig.count === 0) {
  db.prepare(
    `
    INSERT INTO agent_config (id, openai_api_key, fal_api_key, telegram_token, telegram_enabled, twitter_username, twitter_password, twitter_email, twitter_enabled, first_run)
    VALUES (1, NULL, NULL, NULL, FALSE, NULL, NULL, NULL, FALSE, TRUE)
  `
  ).run();
  console.log("✅ Default agent_config entry created.");
}

// 🔹 Create Deployed Agent table (Tracks last deployed agent)
db.exec(`
  CREATE TABLE IF NOT EXISTS deployed_agent (
    id INTEGER PRIMARY KEY DEFAULT 1,
    agent_name TEXT NOT NULL,
    deployed_at TEXT NOT NULL
  );
`);

// 🔹 Function to seed a default admin user
function seedDefaultUser() {
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || "degenwaifu";

  const existingUser = db
    .prepare("SELECT username FROM users WHERE username = ?")
    .get(defaultUsername);

  if (!existingUser) {
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
      defaultUsername,
      hashedPassword
    );
    console.log(`🚀 Default admin user created: ${defaultUsername}`);
  } else {
    console.log(
      `✅ User '${defaultUsername}' already exists. Skipping creation.`
    );
  }
}

// 🔹 Function to set environment variables from agent_config
function loadAgentConfig() {
  const stmt = db.prepare("SELECT * FROM agent_config WHERE id = 1");
  const config = stmt.get();

  if (config) {
    if (config.openai_api_key)
      process.env.OPENAI_API_KEY = config.openai_api_key;
    if (config.fal_api_key) process.env.FALAI_API_KEY = config.fal_api_key;
    if (config.telegram_token)
      process.env.TELEGRAM_BOT_TOKEN = config.telegram_token;
    if (config.twitter_username)
      process.env.TWITTER_USERNAME = config.twitter_username;
    if (config.twitter_password)
      process.env.TWITTER_PASSWORD = config.twitter_password;
    if (config.twitter_email) process.env.TWITTER_EMAIL = config.twitter_email;

    console.log("✅ Environment variables set from database.");
  } else {
    console.log("⚠️ No agent configuration found in database.");
  }
}

// 🔹 Run seed functions
seedDefaultUser();
loadAgentConfig();

module.exports = db;
