const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// Generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );
}

// Route: Register
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
      username,
      hashedPassword
    );
    res
      .status(201)
      .json({ success: true, message: "User registered successfully." });
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Username already exists." });
    } else {
      res.status(500).json({ error: "Database error." });
    }
  }
});

// Route: Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const user = db
      .prepare("SELECT * FROM users WHERE username = ?")
      .get(username);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const token = generateToken(user);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
