import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CharacterForm from "./CharacterForm";

function AdminPanel() {
  const navigate = useNavigate();

  // 🔹 State for API Keys & Client Flags (Config for /agent/config endpoints)
  const [config, setConfig] = useState({
    openAiApiKey: "",
    falApiKey: "",
    telegramEnabled: false,
    telegramToken: "",
    twitterEnabled: false,
    twitterUsername: "",
    twitterPassword: "",
    twitterEmail: "",
  });

  // 🔹 State for Character Metadata (for JSON generation)
  const [character, setCharacter] = useState({
    personality: "sweet_caring",
    appearance: "blonde",
    bodyType: "slim",
    occupation: "graphics_designer",
    modelProvider: "openai",
  });

  // 🔹 State for Character JSON Editing
  const [jsonText, setJsonText] = useState("");
  const [charJson, setCharJson] = useState({});

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 🔹 Fetch Existing Config on Load
  useEffect(() => {
    async function fetchConfig() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/config", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setConfig(response.data.config);
        }
      } catch (err) {
        console.error("Error fetching config:", err);
        setStatusMessage("⚠️ Failed to fetch AI agent configuration.");
      }
    }
    fetchConfig();
  }, [refresh]);

  // 🔹 Fetch Existing Character JSON
  useEffect(() => {
    async function fetchCharacterJson() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/config/character_json", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setJsonText(JSON.stringify(response.data.characterJson, null, 2));
          // Test JSON Form
          setCharJson(response.data.characterJson);
        }
      } catch (err) {
        console.error("Error fetching character JSON:", err);
      }
    }
    fetchCharacterJson();
  }, [refresh]);

  // 🔹 Handle Save Character Configuration Form
  const handleJSONFormSubmit = async (data) => {
    console.log("Character JSON Data:", data);
    // Send `data` to the backend or process it
    const characterJsonString = JSON.stringify(data, null, 2);
    if (!characterJsonString.trim()) {
      setStatusMessage("❌ Cannot save an empty JSON.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Saving Character JSON...");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/agent/character/save",
        { characterJson: characterJsonString },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setStatusMessage("✅ Character JSON saved successfully!");
      } else {
        setStatusMessage("❌ Failed to save Character JSON.");
      }

      setTimeout(() => {
        setRefresh((prev) => !prev);
      }, 1000);
    } catch (err) {
      console.error("❌ Error saving JSON:", err);
      setStatusMessage("❌ Failed to save Character JSON.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle Generate Character JSON
  const handleGenerateJson = async () => {
    setIsLoading(true);
    setStatusMessage("🔄 Generating Character JSON...");

    try {
      const token = localStorage.getItem("token");

      const activeClients = {};
      if (config.telegramEnabled) activeClients["telegram"] = true;
      if (config.twitterEnabled) activeClients["twitter"] = true;
      const clientsString = JSON.stringify(Object.keys(activeClients));

      const payload = {
        personality: character.personality,
        appearance: character.appearance,
        bodyType: character.bodyType,
        occupation: character.occupation,
        modelProvider: character.modelProvider,
        clientsArrJsonString: clientsString,
      };

      const response = await axios.post(
        "/config/generate_character_json_string",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setJsonText(JSON.stringify(response.data.characterJson, null, 2));
        setCharJson(response.data.characterJson);
        setStatusMessage("✅ Character JSON generated successfully!");
      } else {
        setStatusMessage("❌ Failed to generate Character JSON.");
      }
    } catch (err) {
      console.error("❌ Error generating JSON:", err);
      setStatusMessage("❌ Error generating Character JSON.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle Character Input Changes
  const handleCharacterChange = (e) => {
    const { name, value } = e.target;
    setCharacter((prevCharacter) => ({ ...prevCharacter, [name]: value }));
  };

  // 🔹 Handle Config Input Changes
  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  // 🔹 Handle Client Checkbox Toggle
  const handleClientToggle = (client) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [`${client}Enabled`]: !prevConfig[`${client}Enabled`],
      [`${client}Token`]: prevConfig[`${client}Enabled`]
        ? ""
        : prevConfig[`${client}Token`],
    }));
  };

  // 🔹 Handle Save Character JSON (Overwrite Character JSON)
  const handleSaveJson = async () => {
    if (!jsonText.trim()) {
      setStatusMessage("❌ Cannot save an empty JSON.");
      return;
    }

    setIsLoading(true);
    setStatusMessage("Saving Character JSON...");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "/agent/character/save",
        { characterJson: jsonText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setStatusMessage("✅ Character JSON saved successfully!");
      } else {
        setStatusMessage("❌ Failed to save Character JSON.");
      }
    } catch (err) {
      console.error("❌ Error saving JSON:", err);
      setStatusMessage("❌ Failed to save Character JSON.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle Save Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Saving AI Agent Configuration...");

    // ✅ Ensure required fields are not empty before submitting
    if (!config.openAiApiKey.trim()) {
      setStatusMessage("❌ At least one LLM API Key is required.");
      setIsLoading(false);
      return;
    }

    // ✅ Validate Telegram token if enabled
    if (config.telegramEnabled && !config.telegramToken.trim()) {
      setStatusMessage("❌ Telegram token is required.");
      setIsLoading(false);
      return;
    }

    // ✅ Validate Twitter credentials if enabled
    if (config.twitterEnabled) {
      if (
        !config.twitterUsername.trim() ||
        !config.twitterPassword.trim() ||
        !config.twitterEmail.trim()
      ) {
        setStatusMessage("❌ Twitter credentials are required.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post("/config/save", config, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusMessage("✅ AI Agent configuration saved successfully!");

      setTimeout(() => {
        setRefresh((prev) => !prev);
      }, 1000);
    } catch (err) {
      console.error("Error saving agent:", err.response || err);
      setStatusMessage("❌ Failed to save AI Agent configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle Deploy Agent
  const handleDeploy = async () => {
    setIsLoading(true);
    setStatusMessage("Deploying AI Agent...");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/agent/deploy",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStatusMessage("✅ AI Agent deployed successfully!");
    } catch (err) {
      console.error("Error deploying agent:", err.response || err);
      setStatusMessage("❌ Failed to deploy AI Agent.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Handle Stop Agent
  const handleStopAgent = async () => {
    setIsLoading(true);
    setStatusMessage("🛑 Stopping AI Agent...");

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/agent/stop",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStatusMessage("✅ AI Agent stopped successfully!");
    } catch (err) {
      console.error("Error stopping agent:", err.response || err);
      setStatusMessage("❌ Failed to stop AI Agent.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center h-screen bg-gray-100">
      <CharacterForm existingData={charJson} onSubmit={handleJSONFormSubmit} />
      <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Zetta AI Agent Config
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {/* Personality */}
            <label className="block mb-2 font-bold">Personality</label>
            <select
              name="personality"
              value={character.personality}
              onChange={handleCharacterChange}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="sweet_caring">Sweet/Caring</option>
              <option value="bubbly_excited">Bubbly/Excited</option>
              <option value="cold_cynical">Cold/Cynical</option>
              <option value="emotionless_deadpan">Emotionless/Deadpan</option>
            </select>

            {/* Appearance */}
            <label className="block mb-2 font-bold">Appearance</label>
            <select
              name="appearance"
              value={character.appearance}
              onChange={handleCharacterChange}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="blonde">Blonde</option>
              <option value="brunette">Brunette</option>
              <option value="redhead">Redhead</option>
            </select>

            {/* Body Type */}
            <label className="block mb-2 font-bold">Body Type</label>
            <select
              name="bodyType"
              value={character.bodyType}
              onChange={handleCharacterChange}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="slim">Slim</option>
              <option value="thick">Thick</option>
            </select>

            {/* Occupation */}
            <label className="block mb-2 font-bold">Occupation</label>
            <select
              name="occupation"
              value={character.occupation}
              onChange={handleCharacterChange}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="graphics_designer">Graphics Designer</option>
              <option value="cycling_coach">Cycling Coach</option>
              <option value="gamer_girl">Gamer Girl</option>
            </select>

            {/* Agent LLM Model */}
            <label className="block mb-2 font-bold">Model Provider</label>
            <select
              name="modelProvider"
              value={character.modelProvider}
              onChange={handleCharacterChange}
              className="w-full p-3 border rounded-lg mb-4"
            >
              <option value="openai">ChatGPT (OpenAI)</option>
              <option value="anthropic">Claude (Anthropic)</option>
            </select>

            {/* JSON Editor */}
            <h3 className="mt-6 font-bold">Character JSON</h3>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows="10"
              className="w-full p-2 border rounded-lg mt-2 font-mono text-sm"
            ></textarea>
            <div className="flex">
              <button
                type="button"
                onClick={handleGenerateJson}
                className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 mt-4 ml-auto"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Generate"}
              </button>

              <button
                type="button"
                onClick={handleSaveJson}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-4 ml-2"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Save Character"}
              </button>
            </div>
          </div>
          <div>
            {/* OpenAI API Key */}

            <label className="block mb-2 font-bold">OpenAI API Key</label>
            <input
              type="text"
              placeholder="OpenAI API Key"
              name="openAiApiKey"
              value={config.openAiApiKey}
              onChange={handleConfigChange}
              required
              className="w-full p-3 border rounded-lg mb-4"
            />

            {/* FAL.AI API Key */}
            <label className="block mb-2 font-bold">FAL.AI API Key</label>
            <input
              type="text"
              placeholder="FAL.AI API Key"
              name="falApiKey"
              value={config.falApiKey}
              onChange={handleConfigChange}
              className="w-full p-3 border rounded-lg mb-4"
            />

            {/* Clients */}
            <label className="block mb-2 font-bold">Clients</label>
            <div className="mb-4">
              <input
                type="checkbox"
                checked={config.telegramEnabled}
                onChange={() => handleClientToggle("telegram")}
              />
              <span className="ml-2">Telegram</span>
              {config.telegramEnabled && (
                <input
                  type="text"
                  placeholder="Telegram Bot Token"
                  name="telegramToken"
                  value={config.telegramToken}
                  onChange={handleConfigChange}
                  className="w-full p-3 border rounded-lg mb-4"
                />
              )}

              <input
                type="checkbox"
                checked={config.twitterEnabled}
                onChange={() => handleClientToggle("twitter")}
              />
              <span className="ml-2">Twitter</span>
              {config.twitterEnabled && (
                <>
                  <input
                    type="text"
                    placeholder="Twitter Username"
                    name="twitterUsername"
                    value={config.twitterUsername}
                    onChange={handleConfigChange}
                    className="w-full p-3 border rounded-lg mb-4"
                  />
                  <input
                    type="password"
                    placeholder="Twitter Password"
                    name="twitterPassword"
                    value={config.twitterPassword}
                    onChange={handleConfigChange}
                    className="w-full p-3 border rounded-lg mb-4"
                  />
                  <input
                    type="email"
                    placeholder="Twitter Email"
                    name="twitterEmail"
                    value={config.twitterEmail}
                    onChange={handleConfigChange}
                    className="w-full p-3 border rounded-lg mb-4"
                  />
                </>
              )}
            </div>
            <div className="mb-2 text-center">
              <p className="mb-2 bold">
                Save Config before Deploying Agent. Unsaved changes will not be
                reflected.
              </p>
            </div>

            {/* Save, Deploy, Stop, & Back */}
            <div className="flex">
              <button
                onClick={handleSaveConfig}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600 ml-auto"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Save Config"}
              </button>

              <button
                onClick={handleDeploy}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ml-2"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Deploy Agent"}
              </button>

              <button
                onClick={handleStopAgent}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 ml-2"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Stop Agent"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="bg-gray-500 text-white p-2 rounded hover:bg-gray-700 ml-2"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </div>
        </div>
        {statusMessage && <p className="mt-4 text-center">{statusMessage}</p>}
      </form>
    </div>
  );
}

export default AdminPanel;
