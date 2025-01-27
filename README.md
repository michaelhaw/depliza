# **Depliza**

Depliza is a full-stack web application designed to deploy and manage AI-powered agents seamlessly. It leverages modern web technologies for its frontend and backend, integrates with powerful APIs for character generation and deployment, and supports containerized deployment using Docker and Fly.io.

This project integrates the **[Eliza AI Agent](https://github.com/elizaOS/eliza)** repository to power the AI agent's behavior and functionality, enabling highly customizable and interactive agent configurations.

---

## **Features**

### **Frontend**

- Built with **React** and styled using **TailwindCSS**.
- User-friendly UI for managing deployed agents.
- Dynamic forms for adding agents with configurable options like:
  - Personality
  - Appearance
  - Body Type
  - Occupation
  - API Keys (LLM and FAL.AI)
  - Client integrations (e.g., Telegram).
- Secure login and registration system using JWT authentication.

### **Backend**

- Powered by **Express.js** and **better-sqlite3** for lightweight and fast database operations.
- Features include:
  - **User authentication**: JWT-based middleware for protected routes.
  - **Agent management**: Add, retrieve, and manage deployed agents.
  - Integration with Python scripts for:
    - Generating agent configurations (JSON) using OpenAI's ChatGPT.
    - Creating Fly.io configuration files (`fly.toml`).
    - Deploying agents to Fly.io using the Fly.io CLI.
- Environment variable management via **dotenv**.

### **Deployment**

- Fully containerized with **Docker**.
- Integrated with **Fly.io** for hosting and scaling.
- Supports secret management for deployment, including API keys and tokens.

---

## **Getting Started**

### **Prerequisites**

- **Node.js** (v23.3.0 or later)
- **Python** (v3.8+)
- **Docker** and **Docker Compose**
- Fly.io CLI
- Git

### **Environment Variables**

Create a `.env` file in the `backend` directory with the following:

```env
SECRET_KEY=your_jwt_secret_key
FLY_ORGANIZATION=your_flyio_organization
FLY_ACCESS_TOKEN=your_flyio_access_token
OPENAI_API_KEY=your_openai_api_key
AGENT_REPO=eliza-rdai
```

---

## **Setup Instructions**

### 1. **Clone the Repository**

```bash
git clone https://github.com/username/depliza.git
cd depliza
```

### 2. **Install Dependencies**

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
```

#### **Scripts**

```bash
cd ../scripts
pip3 install -r requirements.txt
```

### 3. **Start the Application**

#### **Development**

- **Frontend**:
  ```bash
  cd frontend
  pnpm start
  ```
- **Backend**:
  ```bash
  cd backend
  node app.js
  ```

#### **Production**

Build and run the Docker container:

```bash
docker build -t depliza .
docker run -p 5000:5000 --env-file ./backend/.env depliza
```

---

## **Project Structure**

```
project-root/
├── backend/
│   ├── app.js             # Backend entry point
│   ├── routes/            # API route definitions
│   ├── middleware.js      # JWT and middleware logic
│   ├── db.js              # SQLite database initialization
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   ├── build/             # React build output
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   ├── generate_character_json_chatgpt.py
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

| Method | Endpoint    | Description              |
| ------ | ----------- | ------------------------ |
| POST   | `/register` | Register a new user      |
| POST   | `/login`    | Log in and get JWT token |

### **Deployed Agents**

| Method | Endpoint           | Description                            |
| ------ | ------------------ | -------------------------------------- |
| GET    | `/deployed_agents` | Retrieve deployed agents (protected)   |
| POST   | `/deployed_agents` | Add and deploy a new agent (protected) |

---

## **Scripts Overview**

### **Python Scripts**

- **`generate_character_json_chatgpt.py`**:
  - Generates a JSON configuration for an agent using OpenAI's ChatGPT API.
- **`generate_fly_toml.py`**:
  - Creates a Fly.io configuration file (`fly.toml`) for the agent.
- **`deploy_flyio.py`**:
  - Deploys the agent app to Fly.io with the required secrets and configurations.

---

## **Deployment Workflow**

1. Add an agent using the frontend UI.
2. The backend:
   - Calls `generate_character_json_chatgpt.py` to generate the agent’s JSON file.
   - Calls `generate_fly_toml.py` to generate the Fly.io configuration.
   - Calls `deploy_flyio.py` to deploy the agent to Fly.io.
3. The agent is live and ready to interact with the configured clients (e.g., Telegram).

---

## **Future Features**

- Support for additional LLM models (e.g., Claude).
- More client integrations beyond Telegram.
- Enhanced UI for agent management.
- Monitoring and analytics for deployed agents.

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
