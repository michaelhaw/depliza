const express = require("express");
const authRoutes = require("./auth");
const adminRoutes = require("./admin");

const router = express.Router();

// Route files
router.use(authRoutes);
router.use(adminRoutes);

module.exports = router;
