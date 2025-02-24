const { validate } = require("jsonschema");

const CHARACTER_JSON_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    clients: { type: "array", items: { type: "string" } },
    modelProvider: { type: "string" },
    imageModelProvider: { type: "string" },
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
    "imageModelProvider",
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

function validateCharJsonStructure(jsonContent) {
  const validationResult = validate(jsonContent, CHARACTER_JSON_SCHEMA);
  if (validationResult.valid) {
    return { isValid: true, errorMsg: null };
  } else {
    return {
      isValid: false,
      errorMsg: validationResult.errors.map((e) => e.stack).join(", "),
    };
  }
}

module.exports = { CHARACTER_JSON_SCHEMA, validateCharJsonStructure };
