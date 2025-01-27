const express = require("express");
const authRoutes = require("./auth");
const agentRoutes = require("./agents");

const router = express.Router();

// Route files
router.use(authRoutes);
router.use(agentRoutes);

module.exports = router;
