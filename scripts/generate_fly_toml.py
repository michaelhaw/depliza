import os
import sys
import toml

def generate_fly_toml(username, agent_name, app_name):
    """
    Generate the fly.toml file for the given username and app name.
    The file will be saved in: ../users/<username>/fly.toml
    """
    # Define the directory for the user
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    user_dir = os.path.join(project_root, "users", username)
    os.makedirs(user_dir, exist_ok=True)

    # Define the build args
    character_file = os.path.join("characters", username, f"{agent_name}.character.json")
    character_dest = os.path.join(".", "characters", username, '')

    # Define the fly.toml content (unchanged structure)
    config = {
        "app": app_name,
        "primary_region": 'sjc',
        "build": {
            "args": {  
                "CHAR_FILE": character_file,
                "CHAR_DEST": character_dest,
            }
        },
        "http_service": {
            "internal_port": 3000,
            "force_https": True,
            "auto_stop_machines": False,
            "auto_start_machines": True,
            "min_machines_running": 1,
            "processes": ['app']
        },
        "vm": [
            {
                "memory": '2gb',
                "cpu_kind": 'shared',
                "cpus": 2,
            }
        ]
    }

    # Save the fly.toml file in the user directory
    fly_toml_path = os.path.join(user_dir, "fly.toml")
    try:
        with open(fly_toml_path, "w") as file:
            toml.dump(config, file)
        print(f"fly.toml file generated successfully for app: {app_name}")
        print(f"File saved at: {fly_toml_path}")
    except Exception as e:
        error_message = f"Error writing fly.toml file: {e}"
        print(error_message)
        raise RuntimeError(error_message)


if __name__ == "__main__":
    try:
        if len(sys.argv) != 4:
            raise ValueError("Usage: python generate_fly_toml.py <username> <agent_name> <app_name>")

        username = sys.argv[1]
        agent_name = sys.argv[2]
        app_name = sys.argv[3]

        if not username.strip() or not agent_name.strip() or not app_name.strip():
            raise ValueError("username, agent_name and app_name must be provided and non-empty.")

        # Generate the fly.toml file
        generate_fly_toml(username, agent_name, app_name)
    except ValueError as ve:
        print(f"Input Error: {ve}")
        sys.exit(1)
    except RuntimeError as re:
        print(f"Runtime Error: {re}")
        sys.exit(1)
