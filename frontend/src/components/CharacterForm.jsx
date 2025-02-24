import React, { useState, useEffect } from "react";

const CHARACTER_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    clients: { type: "array", items: { type: "string" } },
    modelProvider: { type: "string" },
    settings: {
      type: "object",
      properties: {
        voice: {
          type: "object",
          properties: { model: { type: "string" } },
          required: ["model"],
        },
      },
      required: ["voice"],
    },
    plugins: { type: "array" },
    bio: { type: "array", items: { type: "string" } },
    lore: { type: "array", items: { type: "string" } },
    knowledge: { type: "array", items: { type: "string" } },
    messageExamples: { type: "array" },
    postExamples: { type: "array", items: { type: "string" } },
    topics: { type: "array", items: { type: "string" } },
    style: {
      type: "object",
      properties: {
        all: { type: "array", items: { type: "string" } },
        chat: { type: "array", items: { type: "string" } },
        post: { type: "array", items: { type: "string" } },
      },
      required: ["all", "chat", "post"],
    },
    adjectives: { type: "array", items: { type: "string" } },
  },
  required: [
    "name",
    "clients",
    "modelProvider",
    "settings",
    "bio",
    "lore",
    "knowledge",
    "messageExamples",
    "postExamples",
    "topics",
    "style",
    "adjectives",
  ],
};

const CharacterForm = ({ existingData, onSubmit }) => {
  const [formData, setFormData] = useState(
    () =>
      existingData || {
        name: "",
        clients: [],
        modelProvider: "",
        settings: { voice: { model: "" } },
        bio: [""],
        lore: [""],
        knowledge: [""],
        messageExamples: [[]],
        postExamples: [""],
        topics: [""],
        style: { all: [""], chat: [""], post: [""] },
        adjectives: [""],
      }
  );

  // Update form data when existingData changes
  useEffect(() => {
    if (existingData) setFormData(existingData);
  }, [existingData]);

  // Handle standard field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle nested object field changes
  const handleNestedChange = (path, value) => {
    setFormData((prev) => {
      const updated = { ...prev };
      let ref = updated;
      const keys = path.split(".");
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          ref[key] = value;
        } else {
          ref[key] = ref[key] || {};
          ref = ref[key];
        }
      });
      return updated;
    });
  };

  // Handle array field changes
  const handleArrayChange = (field, index, value) => {
    setFormData((prev) => {
      const updatedArray = [...prev[field]];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  // Add new item to an array field
  const addArrayItem = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  // Remove an item from an array field
  const removeArrayItem = (field, index) => {
    setFormData((prev) => {
      const updatedArray = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: updatedArray };
    });
  };

  // Special Case: Handle `messageExamples` (Nested Conversations)
  const addConversation = () => {
    setFormData((prev) => ({
      ...prev,
      messageExamples: [...(prev.messageExamples || []), []],
    }));
  };

  const removeConversation = (convIndex) => {
    setFormData((prev) => ({
      ...prev,
      messageExamples: prev.messageExamples.filter((_, i) => i !== convIndex),
    }));
  };

  const addMessageToConversation = (convIndex) => {
    setFormData((prev) => {
      const updatedConversations = [...prev.messageExamples];
      updatedConversations[convIndex].push({ user: "", content: { text: "" } });
      return { ...prev, messageExamples: updatedConversations };
    });
  };

  const removeMessageFromConversation = (convIndex, msgIndex) => {
    setFormData((prev) => {
      const updatedConversations = [...prev.messageExamples];
      updatedConversations[convIndex].splice(msgIndex, 1);
      return { ...prev, messageExamples: updatedConversations };
    });
  };

  const handleMessageChange = (convIndex, msgIndex, key, value) => {
    setFormData((prev) => {
      const updatedConversations = [...prev.messageExamples];
      updatedConversations[convIndex][msgIndex][key] = value;
      return { ...prev, messageExamples: updatedConversations };
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(formData);
      }}
      className="max-w-3xl mx-auto bg-white p-6 shadow-md rounded-md overflow-y-auto"
    >
      <h2 className="text-2xl font-bold mb-4">Character Configuration</h2>

      {Object.entries(CHARACTER_JSON_SCHEMA.properties).map(([key, value]) => (
        <div key={key} className="mb-4">
          <label className="block font-semibold mb-1">
            {key.replace(/([A-Z])/g, " $1")}
          </label>

          {value.type === "string" ? (
            <input
              type="text"
              name={key}
              value={formData[key] || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          ) : value.type === "array" ? (
            key === "messageExamples" ? (
              <div>
                {formData.messageExamples?.map((conversation, convIndex) => (
                  <div key={convIndex} className="border p-3 mb-3">
                    <h3 className="font-bold">Conversation {convIndex + 1}</h3>
                    {conversation.map((message, msgIndex) => (
                      <div key={msgIndex} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="User"
                          value={message.user}
                          onChange={(e) =>
                            handleMessageChange(
                              convIndex,
                              msgIndex,
                              "user",
                              e.target.value
                            )
                          }
                          className="w-1/4 p-2 border rounded-md"
                        />
                        <input
                          type="text"
                          placeholder="Message"
                          value={message.content.text}
                          onChange={(e) =>
                            handleMessageChange(
                              convIndex,
                              msgIndex,
                              "content",
                              { text: e.target.value }
                            )
                          }
                          className="w-3/4 p-2 border rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeMessageFromConversation(convIndex, msgIndex)
                          }
                          className="bg-red-500 text-white px-2 rounded-md"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addMessageToConversation(convIndex)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-md"
                    >
                      + Add Message
                    </button>
                    <button
                      type="button"
                      onClick={() => removeConversation(convIndex)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md ml-2"
                    >
                      ✖ Delete Conversation
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addConversation}
                  className="bg-green-500 text-white px-3 py-1 rounded-md"
                >
                  + Add Conversation
                </button>
              </div>
            ) : (
              <div>
                {formData[key]?.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) =>
                        handleArrayChange(key, index, e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                      required={CHARACTER_JSON_SCHEMA.required.includes(key)}
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem(key, index)}
                      className="bg-red-500 text-white px-2 rounded-md"
                    >
                      ✖
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem(key)}
                  className="bg-blue-500 text-white px-3 py-1 rounded-md"
                >
                  + Add
                </button>
              </div>
            )
          ) : value.type === "object" ? (
            key === "settings" ? (
              // ✅ Special Case: settings.voice.model
              <div className="border p-3 rounded-md">
                <label className="block font-semibold mb-1">voice.model</label>
                <input
                  type="text"
                  value={formData.settings?.voice?.model || ""}
                  onChange={(e) =>
                    handleNestedChange("settings.voice.model", e.target.value)
                  }
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            ) : key === "style" ? (
              // ✅ Special Case: style.all, style.chat, style.post
              <div className="border p-3 rounded-md">
                {["all", "chat", "post"].map((subKey) => (
                  <div key={subKey} className="mb-3">
                    <label className="block font-semibold mb-1">{subKey}</label>
                    {formData.style?.[subKey]?.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const updatedStyle = {
                                ...prev.style,
                                [subKey]: [...prev.style[subKey]],
                              };
                              updatedStyle[subKey][index] = e.target.value;
                              return { ...prev, style: updatedStyle };
                            })
                          }
                          className="w-full p-2 border rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => {
                              const updatedStyle = {
                                ...prev.style,
                                [subKey]: prev.style[subKey].filter(
                                  (_, i) => i !== index
                                ),
                              };
                              return { ...prev, style: updatedStyle };
                            })
                          }
                          className="bg-red-500 text-white px-2 rounded-md"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          style: {
                            ...prev.style,
                            [subKey]: [...prev.style[subKey], ""],
                          },
                        }))
                      }
                      className="bg-blue-500 text-white px-3 py-1 rounded-md"
                    >
                      + Add {subKey}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              Object.entries(value.properties).map(([subKey, subValue]) => (
                <div key={subKey} className="mb-2">
                  <label className="block text-sm font-semibold">
                    {subKey.replace(/([A-Z])/g, " $1")}
                  </label>
                  <input
                    type="text"
                    value={formData[key]?.[subKey] || ""}
                    onChange={(e) =>
                      handleNestedChange(`${key}.${subKey}`, e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                    required={value.required?.includes(subKey)}
                  />
                </div>
              ))
            )
          ) : null}
        </div>
      ))}

      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded-md mt-4"
      >
        Save Configuration
      </button>
    </form>
  );
};

export default CharacterForm;
