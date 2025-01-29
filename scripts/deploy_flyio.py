import os
import sys
import subprocess
import toml
import json

def deploy_app(agent_repo, agent_name, organization, llm_model, llm_api_key, fal_api_key, clients, fly_access_token):
    """
    Deploy an app to Fly.io with the specified configuration and secrets.
    """
    if not fly_access_token.strip():
        raise ValueError("Fly.io access token is missing.")

    os.environ["FLY_ACCESS_TOKEN"] = fly_access_token
    print("Fly.io access token set.")

    # Define paths
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    agent_app_root = os.path.join(project_root, agent_repo)
    fly_toml_path = os.path.join(project_root, "config", "fly.toml")

    if not os.path.exists(fly_toml_path):
        raise FileNotFoundError("fly.toml not found.")

    # Load fly.toml to extract the app name
    config = toml.load(fly_toml_path)
    app_name = config.get("app", "").strip()

    # Validate that we have a valid app name
    if not app_name:
        raise ValueError("The app name is missing in the fly.toml file.")

    print(f"Deploying app '{app_name}'...")

    # Secrets to set
    secrets = {
        "CHARACTER_FILE": os.path.join("/app", "characters", f"{agent_name}.character.json"),
        "FAL_API_KEY": fal_api_key,
        "LLM_MODEL": llm_model
    }

    # Determine the LLM API key based on the model
    if llm_model == "openai":
        secrets["OPENAI_API_KEY"] = llm_api_key
    elif llm_model == "anthropic":
        secrets["ANTHROPIC_API_KEY"] = llm_api_key

    # Add client secrets (e.g., Telegram Bot Token, Twitter Credentials)
    try:
        clients_dict = json.loads(clients) if isinstance(clients, str) else clients
        if not isinstance(clients_dict, dict):
            raise ValueError("Clients must be a JSON object.")

        for client, details in clients_dict.items():
            if client == "telegram" and isinstance(details, str):
                secrets["TELEGRAM_BOT_TOKEN"] = details
            elif client == "twitter" and isinstance(details, dict):
                secrets.update({
                    "TWITTER_USERNAME": details.get("username", ""),
                    "TWITTER_PASSWORD": details.get("password", ""),
                    "TWITTER_EMAIL": details.get("email", "")
                })

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid clients JSON format: {e}")

    # Create the Fly.io app (if it doesn't exist)
    create_command = ["flyctl", "apps", "create", app_name, "--org", organization]
    try:
        subprocess.run(create_command, check=True)
    except subprocess.CalledProcessError:
        print(f"App '{app_name}' may already exist, skipping creation.")

    # Set secrets
    for key, value in secrets.items():
        if value:  # Avoid setting empty secrets
            print(f"Setting secret: {key}")
            try:
                subprocess.run(["flyctl", "secrets", "set", f"{key}={value}", "-a", app_name], check=True)
            except subprocess.CalledProcessError:
                print(f"Failed to set secret {key}.")

    # Deploy the app
    deploy_command = ["flyctl", "deploy", "--config", fly_toml_path, "-a", app_name]
    print("Starting deployment...")
    subprocess.run(deploy_command, cwd=agent_app_root, check=True)

    print(f"App '{app_name}' deployed successfully!")

if __name__ == "__main__":
    """
    Usage:
    python deploy_flyio.py <agent_repo> <agent_name> <organization> <llm_model> <llm_api_key> <fal_api_key> <clients_json> <fly_access_token>
    """
    try:
        # Validate command-line arguments
        if len(sys.argv) != 9:
            raise ValueError(
                "Usage: python deploy_flyio.py <agent_repo> <agent_name> <organization> <llm_model> <llm_api_key> <fal_api_key> <clients_json> <fly_access_token>"
            )

        # Parse command-line arguments
        agent_repo = sys.argv[1]
        agent_name = sys.argv[2]
        organization = sys.argv[3]
        llm_model = sys.argv[4]
        llm_api_key = sys.argv[5]
        fal_api_key = sys.argv[6]
        clients_json = sys.argv[7]
        fly_access_token = sys.argv[8]

        # Deploy the app
        deploy_app(agent_repo, agent_name, organization, llm_model, llm_api_key, fal_api_key, clients_json, fly_access_token)

    except ValueError as ve:
        print(f"Input Error: {ve}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        sys.exit(1)
