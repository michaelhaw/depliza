require("dotenv").config();
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error(
    "Error: SECRET_KEY is not defined in the environment variables."
  );
  process.exit(1);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ error: "Forbidden: Invalid or expired token." });
    }
    req.user = user; // Attach user details to the request object
    next();
  });
}

module.exports = { authenticateToken };
