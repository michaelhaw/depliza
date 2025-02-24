# **Depliza**

Depliza is a full-stack web application designed to deploy and manage an AI-powered agent seamlessly. It leverages modern web technologies for its frontend and backend, integrates with powerful APIs for character generation and deployment, and supports containerized deployment using Docker and Fly.io.

This project integrates the **[Eliza AI Agent](https://github.com/elizaOS/eliza)** repository to power the AI agent's behavior and functionality, enabling highly customizable and interactive agent configurations.

---

## **Features**

### **Frontend**

- Built with **React** and styled using **TailwindCSS**.
- User-friendly UI for managing the deployed agent.
- Dynamic forms for deploying an agent with configurable options like:
  - Personality
  - Appearance
  - Body Type
  - Occupation
  - API Keys (OpenAI, Anthropic, and FAL.AI)
  - Client integrations (e.g., Telegram, Twitter).
- Secure login and registration system using JWT authentication.

### **Backend**

- Powered by **Express.js** and **better-sqlite3** for lightweight and fast database operations.
- Features include:
  - **User authentication**: JWT-based middleware for protected routes.
  - **Agent management**: Configure and deploy agent.
  - Integration with Python scripts for:
    - Generating agent configurations (JSON) using OpenAI's ChatGPT.
    - Creating Fly.io configuration files (`fly.toml`).
    - Deploying agents to Fly.io using the Fly.io CLI.
- Environment variable management via **dotenv**.

### **Deployment**

- Fully containerized with **Docker**.
- Integrated with **Fly.io** for hosting and scaling.
- Supports secret management for agent deployment, including API keys and tokens.

---

## **Getting Started**

### **Prerequisites**

- **Node.js** (v23.3.0 or later)
- **Python** (v3.8+)
- **Docker**
- Fly.io CLI
- Git
- pnpm

### **Environment Variables**

Copy the `.env.example` and rename to `.env`. Fill in the following mandatory values for production:

```env
DEPLIZA_SECRET_KEY=your_jwt_secret_key
DEPLIZA_OPENAI_API_KEY=your_openai_api_key
```

The following values need to be configured for local development (non-Docker):

```env
NODE_ENV=production # If you wish to serve the frontend from the backend
PYTHON_EXECUTABLE=path_to_your_python_executable # Example: /home/usr/venv/bin/python
```

---

## **Setup Instructions - Quick Start (Docker)**

### 1. **Clone the Repository**

```bash
git clone https://github.com/Project-Zetta/depliza.git
cd depliza
```

### 2. **Copy env file**

```bash
cp .env.example .env
```

Fill in the required values from [Environment Variables](#environment-variables)

### 3. **Build and run Docker the container**

```bash
cd ..
docker build -t depliza .
docker run -p 5000:5000 -p 3000:3000 --env-file .env depliza
```

---

## **Setup Instructions - Local Development (non-Docker)**

### 1. **Clone the Repository**

```bash
git clone https://github.com/Project-Zetta/depliza.git
cd depliza
```

### 2. **Copy depliza env file**

```bash
cp .env.example .env
```

Fill in the required values from [Environment Variables](#environment-variables)

### 3. **Install Dependencies**

#### **Frontend**

```bash
cd frontend
pnpm install
pnpm run build
```

#### **Backend**

```bash
cd ../backend
pnpm install
# Handles bindings file error
cd node_modules/better-sqlite3
pnpm run build-release
```

#### **Scripts**

```bash
cd ../scripts
pip3 install -r requirements.txt
```

### 4. **Start the Application**

#### **Frontend and Backend as separate process**

- **Frontend**:
  ```bash
  cd frontend
  pnpm vite
  ```
- **Backend**:
  ```bash
  cd backend
  node app.js
  ```

#### **Frontend served by backend (frontend build automatically copies to backend)**

- **Backend**:
  ```bash
  cd backend
  node app.js
  ```

---

## **Deploy to Fly.io**

### 1. Initialize Fly App

From app root (i.e. `.../depliza`) \*Must be authenticated with fly.io

```bash
fly apps create depliza [-o org_name]
```

### 2. Create Persistent Volume

```bash
fly volumes create app_data --size 50 --app depliza
```

Select y and choose volume region

### 3. Set Fly Secrets

Set the required environment variables as Fly App Secrets, see [Environment Variables](#environment-variables)

```bash
fly secrets set "DEPLIZA_SECRET_KEY=jwt_secret_key"
fly secrets set "DEPLIZA_OPENAI_API_KEY=your_openai_api_key"
```

### 4. Deploy App

```
fly deploy --config fly.toml
```

---

## **Project Structure**

```
project-root/
├── backend/
│   ├── app.js             # Backend entry point
│   ├── routes/            # API route definitions
│   ├── util/              # Utility functions
│   ├── middleware.js      # JWT and middleware logic
│   ├── db.js              # SQLite database initialization
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   ├── dist/               # Vite React build output
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   ├── generate_character_json_chatgpt_stdout.py
│   ├── generate_fly_toml.py
│   ├── deploy_flyio.py
│   └── requirements.txt   # Python dependencies
├── Dockerfile
├── .gitignore
├── fly.toml               # Fly.io configuration
└── README.md
```

---

## **API Endpoints**

### **Authentication**

| Method | Endpoint | Description              |
| ------ | -------- | ------------------------ |
| POST   | `/login` | Log in and get JWT token |
| POST   | `/user`  | Get logged in user       |

### **Deployed Agents**

| Method | Endpoint                 | Description                                    |
| ------ | ------------------------ | ---------------------------------------------- |
| GET    | `/deployed_agent`        | Retrieve deployed agents (protected)           |
| GET    | `/config`                | Retrieve current agent config (protected)      |
| POST   | `/config/character_json` | Generate character json (protected)            |
| GET    | `/config/character_json` | Fetch saved character json (protected)         |
| POST   | `/config/save`           | Save agent config (protected)                  |
| POST   | `/config/deploy`         | Deploy agent based on saved config (protected) |

---

## **Scripts Overview**

### **Python Scripts**

- **`generate_character_json_chatgpt_stdout.py`**:
  - Generates a JSON configuration for an agent using OpenAI's ChatGPT API and output to console for retrieval.
- **`generate_fly_toml.py`**:
  - Creates a Fly.io configuration file (`fly.toml`) for the agent.
- **`deploy_flyio.py`**:
  - Deploys the agent app to Fly.io with the required secrets and configurations.

---

## **Deployment Workflow**

1. Configure an agent using the frontend UI.
   - Calls `generate_character_json_chatgpt_stdout.py` to generate the agent’s JSON file.
2. Save Config:
   - Saves the character JSON into a file.
   - Saves other config values to database.
3. Deploy Agent:
   - Calls `generate_fly_toml.py` to generate the Fly.io configuration.
   - Calls `deploy_flyio.py` to deploy the agent to Fly.io.
4. The agent is live and ready to interact with the configured clients (e.g., Telegram, Twitter).

---

## **Future Features**

- Support for additional LLM models (e.g., Gemini, Deepseek, etc.).
- More client integrations beyond Telegram and Twitter.
- Enhanced UI for agent management.
- Monitoring and analytics for deployed agent.

---

## **Contributing**

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m "Add feature-name"`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

---

## **License**

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
