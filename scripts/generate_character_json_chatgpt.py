import os
import json
import sys
import openai
from openai import OpenAI

def prompt_chatgpt_to_generate_json(api_key, agent_name, personality, appearance, body_type, occupation, clients, model_provider):
    """
    Sends a prompt to ChatGPT to generate a character JSON file based on the inputs.
    """
    # Create the OpenAI client
    client = OpenAI(api_key=api_key)

    # Construct the prompt
    prompt = f"""
    Create a JSON file for a fictional character with the following structure:
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
                        "text": "Write a creative and engaging reply in the style of their personality."
                    }}
                }}
            ],
            [
                {{
                    "user": "{{{{user1}}}}",
                    "content": {{
                        "text": "What’s your latest project?"
                    }}
                }},
                {{
                    "user": "{agent_name}",
                    "content": {{
                        "text": "Explain what they’re working on using {occupation} skills and their personality."
                    }}
                }}
            ]
        ],
        "postExamples": [
            "Create short social media-style posts reflecting their personality and interests."
        ],
        "topics": [
            "List a few topics they enjoy discussing."
        ],
        "style": {{
            "all": [
                "Provide a list of one-word adjectives describing the overall style, e.g., friendly, witty."
            ],
            "chat": [
                "Provide a list of one-word adjectives describing the style used in chat."
            ],
            "post": [
                "Provide a list of one-word adjectives describing the style used in posts."
            ]
        }},
        "adjectives": [
            "List some personality traits."
        ]
    }}
    Ensure the JSON is well-formed, creative, and adheres to the described structure.
    """

    # Send the prompt to ChatGPT
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            store=True,
        )

        # Extract the content of the response
        raw_content = completion.choices[0].message.content

        # Remove any code block markers (` ```json `) if present
        if raw_content.startswith("```json"):
            raw_content = raw_content.strip("```json").strip("```")
        return raw_content

    except openai.APIConnectionError as e:
        print("Error: The server could not be reached.")
        print(e.__cause__)
    except openai.RateLimitError as e:
        print("Error: Rate limit exceeded. Please back off and try again later.")
    except openai.APIStatusError as e:
        print(f"Error: Received a non-200 status code: {e.status_code}")
        print(e.response)
    except Exception as e:
        print("An unexpected error occurred:")
        print(e)

    return None

def save_json_to_file(json_content, agent_repo, username, agent_name):
    """
    Saves the generated JSON content to <project root>/users/<username>/<agentName>.character.json
    and prints the parsed JSON to the console.
    """
    # Get the project root by going up from the script's directory
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # Derive the agent_app_root (path to the agent repository)
    agent_app_root = os.path.join(project_root, agent_repo)
    
    # Define the characters directory within the agent repository
    characters_dir = os.path.join(agent_app_root, "characters", username)
    
    # Ensure the directory exists
    os.makedirs(characters_dir, exist_ok=True)

    # Define the output file path
    output_file = os.path.join(characters_dir, f"{agent_name}.character.json")

    try:
        # Parse and pretty-print the JSON
        parsed_json = json.loads(json_content)
        
        # Print the parsed JSON to the console
        print("\nGenerated Character JSON:")
        print(json.dumps(parsed_json, indent=4))
        
        # Save the JSON to a file
        with open(output_file, "w") as f:
            json.dump(parsed_json, f, indent=4)
        print(f"Character JSON has been saved to {output_file}")
    except json.JSONDecodeError as e:
        error_message = f"Error parsing the JSON response: {e}"
        print(error_message)
        raise ValueError(error_message)
    except Exception as e:
        error_message = f"Error saving the JSON file: {e}"
        print(error_message)
        raise RuntimeError(error_message)
    

if __name__ == "__main__":
    try:
        # Validate command-line arguments
        if len(sys.argv) != 11:
            raise ValueError(
                "Usage: python generate_character_json_chatgpt.py <apiKey> <agentName> <personality> <appearance> <bodyType> <occupation> <clients> <modelProvider> <username> <agentRepo>"
            )

        # Extract inputs from command-line arguments
        api_key = sys.argv[1]
        agent_name = sys.argv[2]
        personality = sys.argv[3]
        appearance = sys.argv[4]
        body_type = sys.argv[5]
        occupation = sys.argv[6]
        clients = sys.argv[7]  # This should be passed as a JSON-formatted string, e.g., '["telegram", "discord"]'
        model_provider = sys.argv[8]
        username = sys.argv[9]
        agent_repo = sys.argv[10]

        # Convert clients string to a proper Python list
        try:
            clients_list = json.loads(clients)
            if not isinstance(clients_list, list):
                raise ValueError("Clients must be a JSON-formatted array (e.g., '[\"telegram\", \"discord\"]').")
        except json.JSONDecodeError:
            raise ValueError("Clients argument must be a JSON-formatted array (e.g., '[\"telegram\", \"discord\"]').")

        # Prompt ChatGPT to generate the JSON
        print(f"Prompting ChatGPT to create a character JSON for '{agent_name}'...")
        chatgpt_response = prompt_chatgpt_to_generate_json(api_key, agent_name, personality, appearance, body_type, occupation, clients, model_provider)

        if chatgpt_response:
            save_json_to_file(chatgpt_response, agent_repo, username, agent_name)
        else:
            raise RuntimeError("Failed to generate a character JSON from ChatGPT.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1) 