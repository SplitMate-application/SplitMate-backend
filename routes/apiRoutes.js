const express = require("express");
const router = express.Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working correctly",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Echo endpoint (for testing)
router.post("/echo", (req, res) => {
  res.json({
    success: true,
    message: "Echo response",
    data: {
      body: req.body,
      query: req.query,
      headers: {
        "user-agent": req.get("User-Agent"),
        "content-type": req.get("Content-Type"),
        accept: req.get("Accept"),
      },
      timestamp: new Date().toISOString(),
    },
  });
});

// Status endpoint
router.get("/status", (req, res) => {
  const status = {
    success: true,
    data: {
      status: "operational",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    },
  };

  res.json(status);
});

// Ping endpoint
router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "pong",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
