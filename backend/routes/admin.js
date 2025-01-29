const express = require("express");
const path = require("path");
const { authenticateToken } = require("../middleware");
const db = require("../db");
const { callPythonScript } = require("../util/pythonUtils");

const router = express.Router();

// Define a single main AI agent
const MAIN_AGENT_NAME = process.env.MAIN_AGENT_NAME || "Zetta";

// 🔹 Get deployed AI agent details
router.get("/deployed_agent", authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM ai_agent WHERE id = 1");
    const agent = stmt.get();

    if (!agent) {
      return res.status(404).json({ error: "No deployed agent found." });
    }

    res.json({
      success: true,
      agent: {
        agent_name: agent.agent_name,
        personality: agent.personality,
        appearance: agent.appearance,
        body_type: agent.body_type,
        occupation: agent.occupation,
        llm_model: agent.llm_model,
        llm_api_key: agent.llm_api_key,
        fal_api_key: agent.fal_api_key,
        clients: {
          telegram: agent.telegram_token,
          twitter: {
            twitter_username: agent.twitter_username,
            twitter_password: agent.twitter_password,
            twitter_email: agent.twitter_email,
          },
        },
        deployed_at: agent.deployed_at,
        status: "active", // Future: Fetch real-time status from Fly.io if needed
      },
    });
  } catch (err) {
    console.error("Failed to retrieve deployed agent:", err);
    res.status(500).json({ error: "Failed to retrieve deployed agent." });
  }
});

// 🔹 Get AI Agent Configuration
router.get("/config", authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM ai_agent WHERE id = 1");
    const agent = stmt.get();

    if (!agent) {
      return res.status(404).json({ error: "Agent configuration not found." });
    }

    res.json({ success: true, agent });
  } catch (err) {
    console.error("Failed to retrieve agent configuration:", err);
    res.status(500).json({ error: "Failed to retrieve agent configuration." });
  }
});

// 🔹 Update AI Agent Configuration (Triggers Deployment)
router.post("/config", authenticateToken, async (req, res) => {
  const {
    personality,
    appearance,
    bodyType,
    occupation,
    llmModel,
    llmApiKey,
    falApiKey,
    clients,
  } = req.body;

  if (
    !personality ||
    !appearance ||
    !bodyType ||
    !occupation ||
    !llmModel ||
    !llmApiKey ||
    !falApiKey ||
    !clients
  ) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const flyAccessToken = process.env.FLY_ACCESS_TOKEN;
  const organization = process.env.FLY_ORGANIZATION;
  const agentRepo = process.env.AGENT_REPO;

  if (!flyAccessToken || !organization || !agentRepo) {
    return res.status(500).json({
      error: "Server misconfiguration: Missing environment variables.",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: Missing API key." });
  }

  const characterGenScript = path.resolve(
    __dirname,
    "../../scripts/generate_character_json_chatgpt.py"
  );
  const flyTomlScript = path.resolve(
    __dirname,
    "../../scripts/generate_fly_toml.py"
  );
  const flyDeployScript = path.resolve(
    __dirname,
    "../../scripts/deploy_flyio.py"
  );

  const appName = `main-agent`;

  // Extract client credentials (Telegram & Twitter)
  const telegramToken = clients.telegram || "";
  const twitterUsername = clients.twitter?.username || "";
  const twitterPassword = clients.twitter?.password || "";
  const twitterEmail = clients.twitter?.email || "";

  try {
    // Update the agent configuration in the database
    const updateStmt = db.prepare(`
      INSERT INTO ai_agent (
        id, agent_name, personality, appearance, body_type, occupation,
        llm_model, llm_api_key, fal_api_key, telegram_token,
        twitter_username, twitter_password, twitter_email, deployed_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        agent_name = excluded.agent_name,
        personality = excluded.personality,
        appearance = excluded.appearance,
        body_type = excluded.body_type,
        occupation = excluded.occupation,
        llm_model = excluded.llm_model,
        llm_api_key = excluded.llm_api_key,
        fal_api_key = excluded.fal_api_key,
        telegram_token = excluded.telegram_token,
        twitter_username = excluded.twitter_username,
        twitter_password = excluded.twitter_password,
        twitter_email = excluded.twitter_email,
        deployed_at = datetime('now')
    `);
    updateStmt.run(
      MAIN_AGENT_NAME,
      personality,
      appearance,
      bodyType,
      occupation,
      llmModel,
      llmApiKey,
      falApiKey,
      telegramToken,
      twitterUsername,
      twitterPassword,
      twitterEmail
    );

    console.log("Starting character generation script...");
    const characterGenArgs = [
      apiKey,
      MAIN_AGENT_NAME,
      personality,
      appearance,
      bodyType,
      occupation,
      JSON.stringify(Object.keys(clients)),
      llmModel,
      agentRepo,
    ];
    await callPythonScript(characterGenScript, characterGenArgs);

    console.log("Starting fly.toml generation script...");
    const flyTomlArgs = [MAIN_AGENT_NAME, appName];
    await callPythonScript(flyTomlScript, flyTomlArgs);

    console.log("Starting Fly.io deployment script...");
    const deployArgs = [
      agentRepo,
      MAIN_AGENT_NAME,
      organization,
      llmModel,
      llmApiKey,
      falApiKey,
      JSON.stringify(clients),
      flyAccessToken,
    ];
    await callPythonScript(flyDeployScript, deployArgs);

    res.status(200).json({ message: "Main AI Agent deployed successfully." });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      error: "Failed to deploy the agent.",
      details: err.message,
    });
  }
});

module.exports = router;
