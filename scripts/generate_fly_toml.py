import os
import sys
import toml

def generate_fly_toml(username, app_name):
    """
    Generate the fly.toml file for the given username and app name.
    The file will be saved in: ../users/<username>/fly.toml
    """
    # Step 1: Define the directory for the user (same as the Character JSON file location)
    app_root = os.getcwd()
    user_dir = os.path.abspath(os.path.join(app_root, "..", "users", username))
    os.makedirs(user_dir, exist_ok=True)  # Ensure the directory exists

    # Step 2: Define the fly.toml content (unchanged structure)
    config = {
        "app": app_name,
        "primary_region": 'sjc',
        "build": {},
        "http_service": {
            "internal_port": 3000,
            "force_https": True,
            "auto_stop_machines": False,
            "auto_start_machines": True,
            "min_machines_running": 0,
            "processes": ['app']
        },
        "vm": [
            {
                "memory": '4gb',
                "cpu_kind": 'shared',
                "cpus": 1,
            }
        ]
    }

    # Step 3: Save the fly.toml file in the user directory
    fly_toml_path = os.path.join(user_dir, "fly.toml")
    try:
        with open(fly_toml_path, "w") as file:
            toml.dump(config, file)
        print(f"fly.toml file generated successfully for app: {app_name}")
        print(f"File saved at: {fly_toml_path}")
    except Exception as e:
        print(f"Error writing fly.toml file: {e}")


def main():
    """
    Main function to generate the fly.toml file based on command-line arguments.
    Usage: python generate_fly_toml.py <username> <app_name>
    """
    if len(sys.argv) != 3:
        print("Usage: python generate_fly_toml.py <username> <app_name>")
        sys.exit(1)

    username = sys.argv[1]
    app_name = sys.argv[2]

    if not username.strip() or not app_name.strip():
        print("Error: Both username and app_name must be provided and non-empty.")
        sys.exit(1)

    generate_fly_toml(username, app_name)


if __name__ == "__main__":
    main()
