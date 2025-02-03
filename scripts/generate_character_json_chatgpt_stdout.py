import os
import json
import sys
import time
import openai
from openai import OpenAI
from jsonschema import validate, ValidationError

CHARACTER_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "clients": {"type": "array", "items": {"type": "string"}},
        "modelProvider": {"type": "string"},
        "imageModelProvider": {"type": "string"},
        "settings": {
            "type": "object",
            "properties": {
                "voice": {
                    "type": "object",
                    "properties": {"model": {"type": "string"}},
                    "required": ["model"],
                }
            },
            "required": ["voice"],
        },
        "plugins": {"type": "array"},
        "bio": {"type": "array", "items": {"type": "string"}},
        "lore": {"type": "array", "items": {"type": "string"}},
        "knowledge": {"type": "array", "items": {"type": "string"}},
        "messageExamples": {"type": "array"},
        "postExamples": {"type": "array", "items": {"type": "string"}},
        "topics": {"type": "array", "items": {"type": "string"}},
        "style": {
            "type": "object",
            "properties": {
                "all": {"type": "array", "items": {"type": "string"}},
                "chat": {"type": "array", "items": {"type": "string"}},
                "post": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["all", "chat", "post"],
        },
        "adjectives": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
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
}

def validate_json_structure(json_content):
    """
    Validates the generated JSON structure using the defined schema.
    """
    try:
        validate(instance=json_content, schema=CHARACTER_JSON_SCHEMA)
        return True, None
    except ValidationError as e:
        return False, str(e)


def prompt_chatgpt_to_generate_json(api_key, agent_name, personality, appearance, body_type, occupation, clients, model_provider, max_retries=3):
    """
    Sends a prompt to ChatGPT to generate a character JSON file.
    Includes reinforcement techniques to ensure better compliance.
    """
    client = OpenAI(api_key=api_key)

    # Define a more structured and explicit prompt
    prompt = f"""
    You are an AI assistant that generates JSON files in a strictly defined format.
    
    Your task: Generate a JSON object representing a fictional AI character. The JSON **must** follow this schema exactly:
    
    {json.dumps(CHARACTER_JSON_SCHEMA, indent=4)}
    
    **Rules:**
    - Ensure all required fields are present and contain valid, non-null values.
    - Do NOT wrap the response in any formatting (e.g., ```json).
    - Do NOT add extra fields beyond those specified in the schema.
    - Maintain correct data types (strings for text, arrays for lists).
    - The following fields and contexts are fixed based on the following values:
        - name: "{agent_name}"
        - clients: {clients}
        - modelProvider: "{model_provider}"
        - imageModelProvider: "falai"
        - settings.voice.model: "en_US-female-medium"
        - Context: 
            - personality={personality}
            - appearance={appearance}
            - body type={body_type}
            - occupation={occupation}

    **Example Template with instructions:**
    {{
        "name": "{agent_name}",
        "clients": {clients},
        "modelProvider": "{model_provider}",
        "imageModelProvider": "falai",
        "settings": {{
            "voice": {{
                "model": "en_US-female-medium"
            }}
        }},
        "plugins": [],
        "bio": [
            "Provide a concise description of their personality and role using the details: personality={personality}, occupation={occupation}."
        ],
        "lore": [
            "Write a detailed backstory about the character, but structure it so that each sentence is a separate element in the array. Use the details: personality={personality}, appearance={appearance}, body type={body_type}, occupation={occupation}."
        ],
        "knowledge": [
            "Provide a list of phrases describing knowledge or skills relevant to {occupation} and other general topics. Each phrase should be its own element in the array."
        ],
        "messageExamples": [
            [
                {{
                    "user": "{{{{user1}}}}",
                    "content": {{
                        "text": "What are you thinking about?"
                    }}
                }},
                {{
                    "user": "{agent_name}",
                    "content": {{
                        "text": "A creative and engaging reply."
                    }}
                }}
            ]
        ],
        "postExamples": ["Short social media-style posts reflecting their personality and interests."],
        "topics": ["List of few topics they enjoy discussing."],
        "style": {{
            "all": ["Provide a list of one-word adjectives describing the overall style based on personality, e.g., friendly, witty."],
            "chat": ["Provide a list of one-word adjectives describing the style used in chat based on personality."],
            "post": ["Provide a list of one-word adjectives describing the style used in posts based on personality."]
        }},
        "adjectives": ["List some personality traits based on overall personality."]
    }}

    **Self-Verification Task:**  
    After generating the JSON, **check your own output**:
    - Ensure all fields match the expected schema.
    - Validate all required properties exist.
    - Confirm no extra fields were included.
    
    If you detect an issue, **regenerate the JSON correctly** before outputting it.
    
    **Final Task:** Output only the **raw JSON** with no explanation.
    """

    retries = 0
    while retries < max_retries:
        try:
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a JSON generation assistant."},
                    {"role": "user", "content": prompt}
                ],
                store=True,
            )

            raw_content = completion.choices[0].message.content

            # Remove formatting if present (e.g., ```json code block)
            if raw_content.startswith("```json"):
                raw_content = raw_content.strip("```json").strip("```")

            parsed_json = json.loads(raw_content)

            # Validate JSON structure
            is_valid, error_msg = validate_json_structure(parsed_json)
            if is_valid:
                return raw_content
            else:
                print(f"⚠️ Invalid JSON format detected. Retrying... ({retries + 1}/{max_retries})")
                retries += 1

        except Exception as e:
            print(f"❌ Error generating JSON: {e}")
            retries += 1

    print("❌ Failed to generate a valid JSON after retries.")
    return None

if __name__ == "__main__":
    if len(sys.argv) != 9:
        raise ValueError("Usage: python generate_character_json_chatgpt.py <apiKey> <agentName> <personality> <appearance> <bodyType> <occupation> <clients> <modelProvider>")

    api_key, agent_name, personality, appearance, body_type, occupation, clients, model_provider = sys.argv[1:]

    clients_list = json.loads(clients)
    
    chatgpt_response = prompt_chatgpt_to_generate_json(api_key, agent_name, personality, appearance, body_type, occupation, clients_list, model_provider)

    if chatgpt_response:
        print(json.dumps(chatgpt_response, indent=4))
    else:
        raise RuntimeError("Failed to generate character JSON.")
