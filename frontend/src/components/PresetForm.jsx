import React from "react";

const PresetForm = ({
  character,
  onCharacterChange,
  onGenerateJson,
  isLoading,
}) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-6xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Character Presets</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {/* Personality */}
          <label className="block mb-2 font-bold">Personality</label>
          <select
            name="personality"
            value={character.personality}
            onChange={onCharacterChange}
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
            onChange={onCharacterChange}
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
            onChange={onCharacterChange}
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
            onChange={onCharacterChange}
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
            onChange={onCharacterChange}
            className="w-full p-3 border rounded-lg mb-4"
          >
            <option value="openai">ChatGPT (OpenAI)</option>
            <option value="anthropic">Claude (Anthropic)</option>
          </select>

          <button
            type="button"
            onClick={onGenerateJson}
            className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 mt-4 w-full"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Generate Character JSON"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresetForm;
