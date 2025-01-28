const express = require("express");
const path = require("path");
const { authenticateToken } = require("../middleware");
const db = require("../db");
const { callPythonScript } = require("../util/pythonUtils");

const router = express.Router();

// Route: Get Deployed Agents
router.get("/deployed_agents", authenticateToken, (req, res) => {
  const userId = req.user.id;

  try {
    const stmt = db.prepare(`
      SELECT id, agent_name, app_name, status, created_at
      FROM deployed_agents
      WHERE user_id = ?
    `);
    const agents = stmt.all(userId);
    res.json({ success: true, agents });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve deployed agents." });
  }
});

// Route: Add Deployed Agent
router.post("/deployed_agents", authenticateToken, async (req, res) => {
  const {
    agentName,
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
    !agentName ||
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

  const username = req.user.username;

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

  const sanitize = (input) => input.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const appName = `${sanitize(username)}-${sanitize(agentName)}-${timestamp}`;

  try {
    console.log("Starting character generation script...");

    const clientNames = Object.keys(clients);
    const characterGenArgs = [
      apiKey,
      agentName,
      personality,
      appearance,
      bodyType,
      occupation,
      JSON.stringify(clientNames),
      llmModel,
      username,
      agentRepo,
    ];
    await callPythonScript(characterGenScript, characterGenArgs);

    console.log("Starting fly.toml generation script...");
    const flyTomlArgs = [username, agentName, appName];
    await callPythonScript(flyTomlScript, flyTomlArgs);

    console.log("Starting Fly.io deployment script...");

    const deployArgs = [
      agentRepo,
      username,
      agentName,
      organization,
      llmModel,
      llmApiKey,
      falApiKey,
      JSON.stringify(clients),
      flyAccessToken,
    ];
    await callPythonScript(flyDeployScript, deployArgs);

    db.prepare(
      `INSERT INTO deployed_agents (user_id, agent_name, app_name, status, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))`
    ).run(req.user.id, agentName, appName, "active");

    res.status(200).json({
      message: "Agent deployed successfully.",
    });
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(400).json({
        error: "An agent with this name already exists for this user.",
      });
    }
    console.error("Error:", err.message);
    res.status(500).json({
      error: "Failed to deploy agent.",
      details: err.message,
    });
  }
});

module.exports = router;
