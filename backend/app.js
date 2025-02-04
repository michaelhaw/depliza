require("dotenv").config({ path: process.env.DOTENV_PATH || ".env" });
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
const { execSync } = require("child_process");
const db = require("./db");

const app = express();
const PORT = process.env.DEPLIZA_SERVER_PORT || 5000;
const APP_ROOT = path.resolve(__dirname, "..");
const AGENT_REPO = process.env.AGENT_REPO || "eliza-zetta";

// Check if this is the first time running
const stmt = db.prepare("SELECT first_run FROM agent_config WHERE id = 1");
const row = stmt.get();

if (row && row.first_run) {
  console.log("🚀 First-time setup detected. Installing and building agent...");

  try {
    // Force prod=false to install devDependencies for building
    execSync(
      `pnpm --prefix ${APP_ROOT}/${AGENT_REPO} install --no-frozen-lockfile --prod=false`,
      {
        stdio: "inherit",
        shell: true,
      }
    );

    execSync(`pnpm --prefix ${APP_ROOT}/${AGENT_REPO} build`, {
      stdio: "inherit",
      shell: true,
    });

    execSync(`pnpm --prefix ${APP_ROOT}/${AGENT_REPO} prune --prod`, {
      stdio: "inherit",
      shell: true,
    });

    // Update the first_run flag to FALSE
    db.prepare("UPDATE agent_config SET first_run = FALSE WHERE id = 1").run();
    console.log("✅ First-time setup completed successfully!");
  } catch (error) {
    console.error("❌ Error during first-time setup:", error);
    process.exit(1);
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Use the routes from routes.js
app.use("/", routes);

// For containerized deployment, serve React frontend from backend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "./frontend/dist");
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
