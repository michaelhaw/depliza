import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AdminPanel() {
  const navigate = useNavigate();

  // 🔹 State for AI Agent Config
  const [config, setConfig] = useState({
    personality: "sweet_caring",
    appearance: "blonde",
    bodyType: "slim",
    occupation: "graphics_designer",
    llmModel: "openai",
    llmApiKey: "",
    falApiKey: "",
    clients: { telegram: false, twitter: false },
  });

  // 🔹 State for Client Credentials
  const [telegramToken, setTelegramToken] = useState("");
  const [twitterUsername, setTwitterUsername] = useState("");
  const [twitterPassword, setTwitterPassword] = useState("");
  const [twitterEmail, setTwitterEmail] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // 🔹 Fetch Existing Config on Load
  useEffect(() => {
    async function fetchConfig() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/config", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.agent) {
          setConfig((prev) => ({
            ...prev,
            ...response.data.agent,
            clients: response.data.agent.clients || {
              telegram: false,
              twitter: false,
            },
          }));

          if (response.data.agent.clients?.telegram) {
            setTelegramToken(response.data.agent.clients.telegram);
          }
          if (response.data.agent.clients?.twitter) {
            setTwitterUsername(response.data.agent.clients.twitter.username);
            setTwitterPassword(response.data.agent.clients.twitter.password);
            setTwitterEmail(response.data.agent.clients.twitter.email);
          }
        }
      } catch (err) {
        console.error("Error fetching config:", err);
        setStatusMessage("⚠️ Failed to fetch AI agent configuration.");
      }
    }
    fetchConfig();
  }, []);

  // 🔹 Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({ ...prevConfig, [name]: value }));
  };

  // 🔹 Handle Client Toggle
  const handleClientChange = (client) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      clients: { ...prevConfig.clients, [client]: !prevConfig.clients[client] },
    }));
  };

  // 🔹 Handle Save & Deploy Configuration
  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage("Updating AI Agent...");

    // ✅ Ensure required fields are not empty before submitting
    if (!config.llmApiKey.trim() || !config.falApiKey.trim()) {
      setStatusMessage("❌ API Keys are required.");
      setIsLoading(false);
      return;
    }

    // ✅ Validate Telegram token if enabled
    if (config.clients.telegram && !telegramToken.trim()) {
      setStatusMessage("❌ Telegram token is required.");
      setIsLoading(false);
      return;
    }

    // ✅ Validate Twitter credentials if enabled
    if (config.clients.twitter) {
      if (
        !twitterUsername.trim() ||
        !twitterPassword.trim() ||
        !twitterEmail.trim()
      ) {
        setStatusMessage("❌ Twitter credentials are required.");
        setIsLoading(false);
        return;
      }
    }

    // Prepare Clients Object
    const updatedClients = {};
    if (config.clients.telegram) updatedClients.telegram = telegramToken;
    if (config.clients.twitter) {
      updatedClients.twitter = {
        username: twitterUsername,
        password: twitterPassword,
        email: twitterEmail,
      };
    }

    // Prepare Payload
    const payload = { ...config, clients: updatedClients };

    try {
      const token = localStorage.getItem("token");
      await axios.post("/config", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStatusMessage("✅ AI Agent updated and deployed successfully!");
    } catch (err) {
      console.error("Error updating agent:", err.response || err);
      setStatusMessage(
        "❌ Failed to update AI Agent. Please check your inputs."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSave}
        className="bg-white p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">AI Agent Config</h2>

        {/* Personality */}
        <label className="block mb-2 font-bold">Personality</label>
        <select
          name="personality"
          value={config.personality}
          onChange={handleChange}
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
          value={config.appearance}
          onChange={handleChange}
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
          value={config.bodyType}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-4"
        >
          <option value="slim">Slim</option>
          <option value="thick">Thick</option>
        </select>

        {/* Occupation */}
        <label className="block mb-2 font-bold">Occupation</label>
        <select
          name="occupation"
          value={config.occupation}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-4"
        >
          <option value="graphics_designer">Graphics Designer</option>
          <option value="cycling_coach">Cycling Coach</option>
          <option value="gamer_girl">Gamer Girl</option>
        </select>

        {/* LLM Model */}
        <label className="block mb-2 font-bold">LLM Model</label>
        <select
          name="llmModel"
          value={config.llmModel}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg mb-4"
        >
          <option value="openai">ChatGPT (OpenAI)</option>
          <option value="anthropic">Claude (Anthropic)</option>
        </select>

        {/* API Key */}
        <input
          type="text"
          placeholder="LLM API Key"
          name="llmApiKey"
          value={config.llmApiKey}
          onChange={handleChange}
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
          onChange={handleChange}
          required
          className="w-full p-3 border rounded-lg mb-4"
        />

        {/* Clients */}
        <label className="block mb-2 font-bold">Clients</label>
        <div className="mb-4">
          <input
            type="checkbox"
            checked={config.clients.telegram}
            onChange={() => handleClientChange("telegram")}
          />
          <span className="ml-2">Telegram</span>
          {config.clients.telegram && (
            <input
              type="text"
              placeholder="Telegram Bot Token"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
            />
          )}

          <input
            type="checkbox"
            checked={config.clients.twitter}
            onChange={() => handleClientChange("twitter")}
          />
          <span className="ml-2">Twitter</span>
          {config.clients.twitter && (
            <>
              <input
                type="text"
                placeholder="Twitter Username"
                value={twitterUsername}
                onChange={(e) => setTwitterUsername(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
              <input
                type="password"
                placeholder="Twitter Password"
                value={twitterPassword}
                onChange={(e) => setTwitterPassword(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
              <input
                type="email"
                placeholder="Twitter Email"
                value={twitterEmail}
                onChange={(e) => setTwitterEmail(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
            </>
          )}
        </div>

        {/* Submit & Back */}
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-lg"
        >
          Save & Deploy
        </button>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="w-full p-3 mt-4 bg-gray-500 text-white rounded-lg"
        >
          Back
        </button>

        {statusMessage && <p className="mt-4 text-center">{statusMessage}</p>}
      </form>
    </div>
  );
}

export default AdminPanel;
