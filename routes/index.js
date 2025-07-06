const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const apiRoutes = require("./apiRoutes");

// Apply routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", apiRoutes);

// API info endpoint
router.get("/info", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "SplitMate API",
      version: "1.0.0",
      description: "A secure backend API for SplitMate application",
      endpoints: {
        auth: "/api/v1/auth",
        users: "/api/v1/users",
        health: "/health",
      },
      documentation: process.env.API_DOCS_URL || "Not available",
    },
  });
});

module.exports = router;
