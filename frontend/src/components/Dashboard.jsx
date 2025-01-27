import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [deployedAgents, setDeployedAgents] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeployedAgents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/deployed_agents",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDeployedAgents(response.data.agents);
      } catch (err) {
        setError("Failed to fetch deployed agents. Please log in again.");
        localStorage.removeItem("token");
        navigate("/");
      }
    };

    fetchDeployedAgents();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Dashboard</h2>
        <div className="flex justify-between mb-6">
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
          <button
            onClick={() => navigate("/add-agent")}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Agent
          </button>
        </div>
        <h3 className="text-xl font-semibold mb-4">Your Deployed Agents</h3>
        {deployedAgents.length === 0 ? (
          <p>No deployed agents found.</p>
        ) : (
          <ul className="space-y-4">
            {deployedAgents.map((agent) => (
              <li
                key={agent.id}
                className="p-4 border rounded-lg shadow-sm bg-gray-50"
              >
                <h4 className="font-bold">{agent.agent_name}</h4>
                <p>App Name: {agent.app_name}</p>
                <p>Status: {agent.status}</p>
                <p>Created At: {new Date(agent.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
