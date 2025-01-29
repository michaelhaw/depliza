const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password." });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.SECRET_KEY,
    {
      expiresIn: "24h",
    }
  );

  console.log("✅ Login successful:", { user, token }); // Debugging line

  res.json({ token, user });
});

// Route to get user info
router.get("/user", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ id: decoded.id, username: decoded.username });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
