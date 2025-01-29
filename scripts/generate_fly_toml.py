import os
import sys
import toml

def generate_fly_toml(agent_name, app_name):
    """
    Generate the fly.toml file for the main AI Agent.
    """
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    config_dir = os.path.join(project_root, "config")
    os.makedirs(config_dir, exist_ok=True)

    character_file = os.path.join("characters", f"{agent_name}.character.json")
    character_dest = os.path.join(".", "characters", '')

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
        "vm": [{"memory": '2gb', "cpu_kind": 'shared', "cpus": 2}]
    }

    fly_toml_path = os.path.join(config_dir, "fly.toml")
    try:
        with open(fly_toml_path, "w") as file:
            toml.dump(config, file)
        print(f"fly.toml saved at: {fly_toml_path}")
    except Exception as e:
        raise RuntimeError(f"Error writing fly.toml: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise ValueError("Usage: python generate_fly_toml.py <agent_name> <app_name>")

    agent_name, app_name = sys.argv[1:]
    generate_fly_toml(agent_name, app_name)
