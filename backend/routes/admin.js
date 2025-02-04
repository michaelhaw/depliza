const express = require("express");
const path = require("path");
const { authenticateToken } = require("../middleware");
const db = require("../db");
const { callPythonScriptJson } = require("../util/pythonUtils");
const { validateCharJsonStructure } = require("../util/charJsonValidator");
const fs = require("fs");
const { spawn } = require("child_process");

const router = express.Router();

// Define a single main AI agent
const MAIN_AGENT_NAME = process.env.MAIN_AGENT_NAME || "Zetta";
const AGENT_REPO = process.env.AGENT_REPO || "eliza-zetta";
const APP_ROOT = path.resolve(__dirname, "../..");
// Directory where JSONs are saved
const CHARACTER_JSON_DIR = path.resolve(APP_ROOT, AGENT_REPO, "characters");
const CHARACTER_JSON_FILE = path.join(
  CHARACTER_JSON_DIR,
  `${MAIN_AGENT_NAME}.character.json`
);

// AI Agent Process Tracker
let runningProcess = null;
const PID_FILE = path.resolve(__dirname, "../../agent.pid");

// 🔹 GET: Fetch Last Deployed Agent Details
router.get("/deployed_agent", authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM deployed_agent WHERE id = 1");
    const agent = stmt.get();

    if (!agent) {
      return res
        .status(404)
        .json({ success: false, message: "No deployed agent found." });
    }

    res.json({
      success: true,
      deployed_agent: {
        agent_name: agent.agent_name,
        deployed_at: agent.deployed_at,
      },
    });
  } catch (err) {
    console.error("Failed to retrieve deployed agent:", err);
    res
      .status(500)
      .json({ success: false, error: "Failed to retrieve deployed agent." });
  }
});

// 🔹 GET: Fetch AI Agent Config
router.get("/config", authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM agent_config WHERE id = 1");
    const config = stmt.get();

    if (!config) {
      return res.status(404).json({ error: "Agent configuration not found." });
    }

    res.json({
      success: true,
      config: {
        openAiApiKey: config.openai_api_key,
        falApiKey: config.fal_api_key,
        telegramEnabled: Boolean(config.telegram_enabled),
        telegramToken: config.telegram_token || "",
        twitterEnabled: Boolean(config.twitter_enabled),
        twitterUsername: config.twitter_username || "",
        twitterPassword: config.twitter_password || "",
        twitterEmail: config.twitter_email || "",
      },
    });
  } catch (err) {
    console.error("Failed to retrieve agent configuration:", err);
    res.status(500).json({ error: "Failed to retrieve agent configuration." });
  }
});

// 🔹 POST: Save AI Agent Config
router.post("/config/save", authenticateToken, async (req, res) => {
  const {
    openAiApiKey,
    falApiKey,
    telegramEnabled,
    telegramToken,
    twitterEnabled,
    twitterUsername,
    twitterPassword,
    twitterEmail,
  } = req.body;

  if (!openAiApiKey) {
    return res.status(400).json({ error: "Missing required API key." });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO agent_config (
        id, openai_api_key, fal_api_key, 
        telegram_enabled, telegram_token, 
        twitter_enabled, twitter_username, twitter_password, twitter_email
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?
      ) ON CONFLICT(id) DO UPDATE SET
        openai_api_key = excluded.openai_api_key,
        fal_api_key = excluded.fal_api_key,
        telegram_enabled = excluded.telegram_enabled,
        telegram_token = excluded.telegram_token,
        twitter_enabled = excluded.twitter_enabled,
        twitter_username = excluded.twitter_username,
        twitter_password = excluded.twitter_password,
        twitter_email = excluded.twitter_email
    `);

    stmt.run(
      openAiApiKey,
      falApiKey,
      telegramEnabled ? 1 : 0,
      telegramToken || null,
      twitterEnabled ? 1 : 0,
      twitterUsername || null,
      twitterPassword || null,
      twitterEmail || null
    );

    // ✅ Update Environment Variables at Runtime
    if (openAiApiKey) process.env.OPENAI_API_KEY = openAiApiKey;
    if (falApiKey) process.env.FALAI_API_KEY = falApiKey;
    if (telegramEnabled && telegramToken)
      process.env.TELEGRAM_BOT_TOKEN = telegramToken;
    else process.env.TELEGRAM_BOT_TOKEN = "";
    if (twitterEnabled) {
      if (twitterUsername) process.env.TWITTER_USERNAME = twitterUsername;
      if (twitterPassword) process.env.TWITTER_PASSWORD = twitterPassword;
      if (twitterEmail) process.env.TWITTER_EMAIL = twitterEmail;
    } else {
      process.env.TWITTER_USERNAME = "";
      process.env.TWITTER_PASSWORD = "";
      process.env.TWITTER_EMAIL = "";
    }

    res.status(200).json({ message: "Configuration saved successfully." });
  } catch (err) {
    console.error("Error saving configuration:", err);
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// 🔹 GET: Fetch Generated Character JSON
router.get("/config/character_json", authenticateToken, (req, res) => {
  try {
    console.log("Retrieving: ", CHARACTER_JSON_FILE);

    if (!fs.existsSync(CHARACTER_JSON_FILE)) {
      return res.status(404).json({ error: "Character JSON file not found." });
    }

    const jsonData = fs.readFileSync(CHARACTER_JSON_FILE, "utf-8");
    res.json({ success: true, characterJson: JSON.parse(jsonData) });
  } catch (err) {
    console.error("Failed to retrieve character JSON:", err);
    res.status(500).json({ error: "Failed to retrieve character JSON." });
  }
});

// 🔹 POST: Generate Character JSON string and return it to frontend
router.post(
  "/config/generate_character_json_string",
  authenticateToken,
  async (req, res) => {
    const {
      personality,
      appearance,
      bodyType,
      occupation,
      modelProvider,
      clientsArrJsonString,
    } = req.body;

    try {
      // ✅ Define Python script path
      const characterGenScript = path.resolve(
        __dirname,
        "../../scripts/generate_character_json_chatgpt_stdout.py"
      );

      // ✅ Call Python script using existing utility function
      const pythonArgs = [
        process.env.DEPLIZA_OPENAI_API_KEY,
        MAIN_AGENT_NAME,
        personality,
        appearance,
        bodyType,
        occupation,
        clientsArrJsonString,
        modelProvider,
      ];

      console.log(pythonArgs.toString());

      const pythonResult = await callPythonScriptJson(
        characterGenScript,
        pythonArgs
      );

      // ✅ Parse JSON output from Python script
      const generatedJson = JSON.parse(pythonResult);

      // ✅ Validate JSON structure before sending it to frontend
      const { isValid, errorMsg } = validateCharJsonStructure(generatedJson);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: `Invalid JSON format: ${errorMsg}` });
      }

      // ✅ Send the valid JSON response to the frontend
      res.json({ success: true, characterJson: generatedJson });
    } catch (err) {
      console.error("❌ Error generating character JSON:", err);
      res.status(500).json({ error: "Failed to generate character JSON." });
    }
  }
);

// 🔹 POST: Save Agent Character Personality JSON
router.post("/agent/character/save", authenticateToken, async (req, res) => {
  const { characterJson } = req.body;

  if (!characterJson) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    // ✅ Validate JSON structure
    let parsedJson;
    try {
      parsedJson = JSON.parse(characterJson);
      const { isValid, errorMsg } = validateCharJsonStructure(parsedJson);
      if (!isValid) {
        return res
          .status(400)
          .json({ error: `Invalid JSON format: ${errorMsg}` });
      }
    } catch (error) {
      return res
        .status(400)
        .json({ error: "Provided JSON is not a valid format." });
    }

    // ✅ Save JSON file
    if (!fs.existsSync(CHARACTER_JSON_DIR)) {
      console.log(`Creating Character JSON Directory at ${CHARACTER_JSON_DIR}`);
      fs.mkdirSync(CHARACTER_JSON_DIR, { recursive: true });
    }
    fs.writeFileSync(CHARACTER_JSON_FILE, JSON.stringify(parsedJson, null, 2));
    console.log(`✅ Character JSON saved at ${CHARACTER_JSON_FILE}`);

    res.status(200).json({
      message: "Configuration & character JSON saved.",
      success: true,
    });
  } catch (err) {
    console.error("Error saving configuration:", err);
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// 🔹 GET: Check if AI Agent is Running
router.get("/agent/status", authenticateToken, async (req, res) => {
  try {
    if (!fs.existsSync(PID_FILE)) {
      return res.json({ running: false, message: "Agent is not running." });
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8"), 10);

    // Check if the process is still running
    try {
      process.kill(pid, 0); // `kill(0)` checks if the process exists without terminating it
      return res.json({ running: true, message: "Agent is running.", pid });
    } catch (err) {
      // Process is no longer running, remove the PID file
      fs.unlinkSync(PID_FILE);
      return res.json({ running: false, message: "Agent is not running." });
    }
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ error: "Failed to check agent status." });
  }
});

// 🔹 POST: Deploy AI Agent
router.post("/agent/deploy", authenticateToken, async (req, res) => {
  try {
    // Ensure only one process runs at a time
    if (fs.existsSync(PID_FILE)) {
      return res.status(400).json({ error: "Agent is already running." });
    }

    const agentCharacterJson = `characters/${MAIN_AGENT_NAME}.character.json`;

    console.log(
      `🚀 Starting agent in ${APP_ROOT} with command: pnpm run --prefix ${AGENT_REPO} start --character="${agentCharacterJson}"`
    );

    // Start process in a new process group (`setsid`)
    const agentProcess = spawn(
      "pnpm",
      [
        "run",
        "--prefix",
        AGENT_REPO,
        "start",
        `--character=${agentCharacterJson}`,
      ],
      {
        stdio: "inherit",
        shell: true,
        cwd: APP_ROOT,
        detached: true, // This allows the process to run independently
      }
    );

    // Save process ID to file for tracking
    fs.writeFileSync(PID_FILE, agentProcess.pid.toString(), "utf-8");

    // ✅ Update Deployment Timestamp
    const now = new Date().toISOString();
    db.prepare(
      `
      INSERT INTO deployed_agent (id, agent_name, deployed_at)
      VALUES (1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        agent_name = excluded.agent_name,
        deployed_at = excluded.deployed_at
    `
    ).run(MAIN_AGENT_NAME, now);

    console.log(`✅ Agent started with PID ${agentProcess.pid}`);

    res.status(200).json({ message: "Agent started successfully." });
  } catch (err) {
    console.error("Deployment error:", err);
    res.status(500).json({ error: "Failed to start AI agent." });
  }
});

// 🔹 POST: Stop AI Agent (optional)
router.post("/agent/stop", authenticateToken, async (req, res) => {
  try {
    if (!fs.existsSync(PID_FILE)) {
      return res.status(400).json({ error: "No running agent to stop." });
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8"), 10);

    console.log(`🛑 Stopping agent with PID ${pid}`);

    // Kill the entire process group
    process.kill(-pid, "SIGTERM");

    // Remove the PID file
    fs.unlinkSync(PID_FILE);

    console.log("✅ Agent stopped successfully.");
    res.status(200).json({ message: "Agent stopped successfully." });
  } catch (err) {
    console.error("❌ Error stopping agent:", err);
    res.status(500).json({ error: "Failed to stop AI agent." });
  }
});

module.exports = router;
