import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });
      setMessage(response.data.message);
      localStorage.setItem("token", response.data.token); // Store the JWT in localStorage
      navigate("/dashboard"); // Redirect to the protected dashboard
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {message && <p className="text-red-500 mb-4">{message}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => navigate("/register")}
          className="w-full p-3 bg-gray-200 text-gray-700 rounded-lg mt-4 hover:bg-gray-300 transition"
        >
          Register
        </button>
      </form>
    </div>
  );
}

export default Login;
