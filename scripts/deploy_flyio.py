import os
import sys
import subprocess
import json
import toml


def deploy_app(agent_repo, username, agent_name, organization, llm_model, llm_api_key, fal_api_key, clients, fly_access_token):
    """
    Deploy an app to Fly.io with the specified configuration and secrets.
    """
    try:
        if not fly_access_token.strip():
            raise ValueError("Error: Fly.io access token is missing or empty.")

        # Set Fly.io access token for authentication
        os.environ["FLY_ACCESS_TOKEN"] = fly_access_token
        print("Fly.io access token set.")

        # Get the project root by going up from the script's directory
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Derive the agent_app_root (path to the agent repository)
        agent_app_root = os.path.join(project_root, agent_repo)

        # Derive the path to fly.toml based on the username
        user_dir = os.path.join(project_root, "users", username)
        fly_toml_path = os.path.join(user_dir, "fly.toml")

        # Validate agent_app_root
        if not os.path.isdir(agent_app_root):
            raise FileNotFoundError(f"Agent app root directory not found: {agent_app_root}")

        # Validate the fly.toml file
        if not os.path.exists(fly_toml_path):
            raise FileNotFoundError(f"The fly.toml file does not exist: {fly_toml_path}")

        # Extract the app name from the fly.toml file
        try:
            config = toml.load(fly_toml_path)
            app_name = config.get("app", "").strip()
            if not app_name:
                raise ValueError("The app name is missing in the fly.toml file.")
        except Exception as e:
            raise RuntimeError(f"Failed to read the fly.toml file: {e}")

        print(f"App name extracted from fly.toml: {app_name}")
        print(f"Deploying app for user '{username}' from root directory: {agent_app_root}")

        # Get the path to <agent_name>.character.json file to use as argument for running the agent (app/characters/<username>/<character file>)
        character_file = os.path.join("/app", "characters", username, f"{agent_name}.character.json")

        # Secrets to set
        secrets = {}

        # Set the character file to <agent_name>.character.json file
        secrets["CHARACTER_FILE"] = character_file

        # Determine the LLM API key based on the model
        if llm_model == "openai":
            secrets["OPENAI_API_KEY"] = llm_api_key
        elif llm_model == "anthropic":
            secrets["ANTHROPIC_API_KEY"] = llm_api_key

        # Set the FAL.AI API Key
        secrets["FAL_API_KEY"] = fal_api_key

        # Add client secrets (e.g., Telegram Bot Token)
        for client, token in clients.items():
            if client == "telegram":
                secrets["TELEGRAM_BOT_TOKEN"] = token

        # Create the app on Fly.io
        create_command = ["flyctl", "apps", "create", app_name, "--org", organization]
        print(f"Creating Fly.io app: {app_name}")
        subprocess.run(create_command, check=True)

        # Set environment variables (secrets) on Fly.io
        for key, value in secrets.items():
            print(f"Setting environment variable: {key}")
            subprocess.run(["flyctl", "secrets", "set", f"{key}={value}", "-a", app_name], check=True)

        # Deploy the app using Fly.io CLI
        deploy_command = ["flyctl", "deploy", "--config", fly_toml_path, "-a", app_name]
        print("Deploying the app...")
        subprocess.run(deploy_command, cwd=agent_app_root, check=True)

        print(f"App '{app_name}' deployed successfully!")

    except FileNotFoundError as fnfe:
        print(f"File Not Found Error: {fnfe}")
        sys.exit(1)
    except ValueError as ve:
        print(f"Value Error: {ve}")
        sys.exit(1)
    except subprocess.CalledProcessError as cpe:
        print(f"Subprocess Error: {cpe}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    """
    Usage:
    python deploy_flyio.py <agent_repo> <username> <organization> <llm_model> <llm_api_key> <fal_api_key> <clients_json> <fly_access_token>
    """
    try:
        # Check for the correct number of arguments
        if len(sys.argv) != 10:
            raise ValueError(
                "Usage: python deploy_flyio.py <agent_repo> <username> <agent_name> <organization> <llm_model> <llm_api_key> <fal_api_key> <clients_json> <fly_access_token>"
            )

        # Parse command-line arguments
        agent_repo = sys.argv[1]
        username = sys.argv[2]
        agent_name = sys.argv[3]
        organization = sys.argv[4]
        llm_model = sys.argv[5]
        llm_api_key = sys.argv[6]
        fal_api_key = sys.argv[7]
        clients_json = sys.argv[8]
        fly_access_token = sys.argv[9]

        # Parse clients JSON string into a Python dictionary
        try:
            clients = json.loads(clients_json)
            if not isinstance(clients, dict):
                raise ValueError("Clients must be a JSON object.")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid clients JSON: {clients_json}. Error: {e}")

        # Deploy the app
        deploy_app(agent_repo, username, agent_name, organization, llm_model, llm_api_key, fal_api_key, clients, fly_access_token)

    except ValueError as ve:
        print(f"Input Error: {ve}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)
