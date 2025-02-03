const express = require("express");
const path = require("path");
const { authenticateToken } = require("../middleware");
const db = require("../db");
const {
  callPythonScript,
  callPythonScriptJson,
} = require("../util/pythonUtils");
const { validateCharJsonStructure } = require("../util/charJsonValidator");
const fs = require("fs");

const router = express.Router();

// Define a single main AI agent
const MAIN_AGENT_NAME = process.env.MAIN_AGENT_NAME || "Zetta";
// Directory where JSONs are saved
const CHARACTER_JSON_DIR = path.resolve(
  __dirname,
  "../..",
  process.env.AGENT_REPO,
  "characters"
);
const CHARACTER_JSON_FILE = path.join(
  CHARACTER_JSON_DIR,
  `${MAIN_AGENT_NAME}.character.json`
);

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
        llmApiKey: agent.llm_api_key,
        falApiKey: agent.fal_api_key,
        clients: {
          telegram: agent.telegram_token,
          twitter: {
            twitter_username: agent.twitter_username,
            twitter_password: agent.twitter_password,
            twitter_email: agent.twitter_email,
          },
        },
        deployed_at: agent.deployed_at,
        status: "active",
      },
    });
  } catch (err) {
    console.error("Failed to retrieve deployed agent:", err);
    res.status(500).json({ error: "Failed to retrieve deployed agent." });
  }
});

// 🔹 GET: Fetch AI Agent Config
router.get("/config", authenticateToken, (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM ai_agent WHERE id = 1");
    const agent = stmt.get();

    if (!agent) {
      return res.status(404).json({ error: "Agent configuration not found." });
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
        llmApiKey: agent.llm_api_key,
        falApiKey: agent.fal_api_key,
        clients: {
          telegram: agent.telegram_token,
          twitter: {
            twitter_username: agent.twitter_username,
            twitter_password: agent.twitter_password,
            twitter_email: agent.twitter_email,
          },
        },
        deployed_at: agent.deployed_at,
        status: "active",
      },
    });
  } catch (err) {
    console.error("Failed to retrieve agent configuration:", err);
    res.status(500).json({ error: "Failed to retrieve agent configuration." });
  }
});

// 🔹 GET: Fetch Generated Character JSON
router.get("/config/character_json", authenticateToken, (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      `../../${process.env.AGENT_REPO}/characters`,
      `${MAIN_AGENT_NAME}.character.json`
    );
    console.log("Retrieving: ", filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Character JSON file not found." });
    }

    const jsonData = fs.readFileSync(filePath, "utf-8");
    res.json({ success: true, characterJson: JSON.parse(jsonData) });
  } catch (err) {
    console.error("Failed to retrieve character JSON:", err);
    res.status(500).json({ error: "Failed to retrieve character JSON." });
  }
});

// 🔹 Generate Character JSON and return it to frontend
router.post(
  "/config/generate_character_json",
  authenticateToken,
  async (req, res) => {
    const { personality, appearance, bodyType, occupation, llmModel, clients } =
      req.body;

    try {
      // ✅ Convert clients object to JSON string format for script input
      const clientsStr = JSON.stringify(Object.keys(clients));

      // ✅ Define Python script path
      const characterGenScript = path.resolve(
        __dirname,
        "../../scripts/generate_character_json_chatgpt_stdout.py"
      );

      // ✅ Call Python script using existing utility function
      const pythonArgs = [
        process.env.OPENAI_API_KEY,
        MAIN_AGENT_NAME,
        personality,
        appearance,
        bodyType,
        occupation,
        clientsStr,
        llmModel,
      ];

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

// 🔹 POST: Save AI Agent Config
router.post("/config/save", authenticateToken, async (req, res) => {
  const {
    personality,
    appearance,
    bodyType,
    occupation,
    llmModel,
    llmApiKey,
    falApiKey,
    clients,
    characterJson,
  } = req.body;

  if (
    !personality ||
    !appearance ||
    !bodyType ||
    !occupation ||
    !llmModel ||
    !llmApiKey ||
    !falApiKey ||
    !clients ||
    !characterJson
  ) {
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
    fs.writeFileSync(CHARACTER_JSON_FILE, JSON.stringify(parsedJson, null, 2));
    console.log(`✅ Character JSON saved at ${CHARACTER_JSON_FILE}`);

    // ✅ Save Configuration to DB
    const updateStmt = db.prepare(`
      INSERT INTO ai_agent (
        id, agent_name, personality, appearance, body_type, occupation,
        llm_model, llm_api_key, fal_api_key, telegram_token,
        twitter_username, twitter_password, twitter_email, deployed_at
      ) VALUES (
        1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL
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
        twitter_email = excluded.twitter_email
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
      clients.telegram || "",
      clients.twitter?.username || "",
      clients.twitter?.password || "",
      clients.twitter?.email || ""
    );

    /* No need to generate, JSON is now input
    // ✅ Generate Character JSON
    console.log("Generating character JSON...");
    const characterGenScript = path.resolve(
      __dirname,
      "../../scripts/generate_character_json_chatgpt.py"
    );

    const apiKey = process.env.OPENAI_API_KEY;
    await callPythonScript(characterGenScript, [
      apiKey,
      MAIN_AGENT_NAME,
      personality,
      appearance,
      bodyType,
      occupation,
      JSON.stringify(Object.keys(clients)),
      llmModel,
      process.env.AGENT_REPO,
    ]);
    */

    res.status(200).json({ message: "Configuration & character JSON saved." });
  } catch (err) {
    console.error("Error saving configuration:", err);
    res.status(500).json({ error: "Failed to save configuration." });
  }
});

// 🔹 POST: Deploy AI Agent
router.post("/config/deploy", authenticateToken, async (req, res) => {
  try {
    const stmt = db.prepare("SELECT * FROM ai_agent WHERE id = 1");
    const agent = stmt.get();

    if (!agent) {
      return res.status(400).json({ error: "No saved configuration found." });
    }

    console.log("Starting Fly.io deployment...");
    const flyTomlScript = path.resolve(
      __dirname,
      "../../scripts/generate_fly_toml.py"
    );
    const flyDeployScript = path.resolve(
      __dirname,
      "../../scripts/deploy_flyio.py"
    );

    const appName = `main-agent`;

    await callPythonScript(flyTomlScript, [MAIN_AGENT_NAME, appName]);

    await callPythonScript(flyDeployScript, [
      process.env.AGENT_REPO,
      MAIN_AGENT_NAME,
      process.env.FLY_ORGANIZATION,
      agent.llm_model,
      agent.llm_api_key,
      agent.fal_api_key,
      JSON.stringify({
        telegram: agent.telegram_token,
        twitter: {
          username: agent.twitter_username,
          password: agent.twitter_password,
          email: agent.twitter_email,
        },
      }),
      process.env.FLY_ACCESS_TOKEN,
    ]);

    res.status(200).json({ message: "Agent deployed successfully." });
  } catch (err) {
    console.error("Deployment error:", err);
    res.status(500).json({ error: "Failed to deploy AI agent." });
  }
});

module.exports = router;
