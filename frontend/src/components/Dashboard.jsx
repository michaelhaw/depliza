import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [deployedAgent, setDeployedAgent] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeployedAgent = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found, redirecting to login.");
          return navigate("/login");
        }

        const response = await axios.get("/deployed_agent", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.data || !response.data.agent) {
          throw new Error("Invalid response from server");
        }

        setDeployedAgent(response.data.agent);
      } catch (err) {
        console.error("API error:", err.message);
        localStorage.removeItem("token");
      }
    };

    fetchDeployedAgent();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
            onClick={() => navigate("/admin")}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Configure Agent
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-4">Your Deployed Agent</h3>

        {error && <p className="text-red-500">{error}</p>}

        {!deployedAgent ? (
          <p>No deployed agent found.</p>
        ) : (
          <ul className="space-y-4">
            <li
              key={deployedAgent.id}
              className="p-4 border rounded-lg shadow-sm bg-gray-50"
            >
              <h4 className="font-bold">{deployedAgent.agent_name}</h4>
              <p>
                Created At:{" "}
                {new Date(deployedAgent.deployed_at).toLocaleString()}
              </p>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
