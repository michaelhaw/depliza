import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddAgent() {
  const [agentName, setAgentName] = useState("");
  const [personality, setPersonality] = useState("sweet_caring");
  const [appearance, setAppearance] = useState("blonde");
  const [bodyType, setBodyType] = useState("slim");
  const [occupation, setOccupation] = useState("graphics_designer");
  const [llmModel, setLlmModel] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [falApiKey, setFalApiKey] = useState("");
  const [clients, setClients] = useState({ telegram: false });
  const [telegramToken, setTelegramToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedClients = {};
    if (clients.telegram) {
      selectedClients["telegram"] = telegramToken;
    }

    const payload = {
      agentName,
      personality,
      appearance,
      bodyType,
      occupation,
      llmModel,
      llmApiKey,
      falApiKey,
      clients: selectedClients,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post("/deployed_agents", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate("/dashboard");
    } catch (err) {
      console.error("Error adding agent:", err.response || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientChange = (client) => {
    setClients((prev) => ({
      ...prev,
      [client]: !prev[client],
    }));
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Add Agent</h2>

        {/* Agent Name */}
        <input
          type="text"
          placeholder="Agent Name"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          required
          disabled={isSubmitting} // Disable input during submission
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />

        {/* Personality */}
        <label className="block mb-2 font-bold">Personality</label>
        <select
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="sweet_caring">Sweet/Caring</option>
          <option value="bubbly_excited">Bubbly/Excited</option>
          <option value="cold_cynical">Cold/Cynical</option>
          <option value="emotionless_deadpan">Emotionless/Deadpan</option>
        </select>

        {/* Appearance */}
        <label className="block mb-2 font-bold">Appearance</label>
        <select
          value={appearance}
          onChange={(e) => setAppearance(e.target.value)}
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="blonde">Blonde</option>
          <option value="brunette">Brunette</option>
          <option value="redhead">Redhead</option>
        </select>

        {/* Body Type */}
        <label className="block mb-2 font-bold">Body Type</label>
        <select
          value={bodyType}
          onChange={(e) => setBodyType(e.target.value)}
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="slim">Slim</option>
          <option value="thick">Thick</option>
        </select>

        {/* Occupation */}
        <label className="block mb-2 font-bold">Occupation</label>
        <select
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="graphics_designer">Graphics Designer</option>
          <option value="cycling_coach">Cycling Coach</option>
          <option value="gamer_girl">Gamer Girl</option>
        </select>

        {/* LLM Model */}
        <label className="block mb-2 font-bold">LLM Model</label>
        <select
          value={llmModel}
          onChange={(e) => setLlmModel(e.target.value)}
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        >
          <option value="openai">ChatGPT (OpenAI)</option>
          <option value="anthropic">Claude (Anthropic)</option>
        </select>

        {/* LLM API Key */}
        <input
          type="text"
          placeholder="LLM API Key"
          value={llmApiKey}
          onChange={(e) => setLlmApiKey(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />

        {/* FAL.AI API Key */}
        <input
          type="text"
          placeholder="FAL.AI API Key"
          value={falApiKey}
          onChange={(e) => setFalApiKey(e.target.value)}
          required
          disabled={isSubmitting}
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
        />

        {/* Clients Section */}
        <label className="block mb-2 font-bold">Clients</label>
        <div className="mb-4">
          {/* Telegram */}
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="telegram"
              checked={clients.telegram}
              onChange={() => handleClientChange("telegram")}
              disabled={isSubmitting}
              className="mr-2"
            />
            <label htmlFor="telegram">Telegram</label>
          </div>
          {clients.telegram && (
            <input
              type="text"
              placeholder="Telegram Bot Token"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            />
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition mb-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : "Add Agent"}
        </button>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          disabled={isSubmitting}
          className="w-full p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
        >
          Back
        </button>
      </form>
    </div>
  );
}

export default AddAgent;
