const path = require("path");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const compression = require("compression");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();
require("express-async-errors");

// Import custom middleware and utilities
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const { logger, requestLogger } = require("./utils/logger");
const { validateRequest } = require("./middleware/validationMiddleware");
const { connectDB } = require("./utils/database");

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting and security headers)
app.set("trust proxy", 1);

// ==================== SECURITY MIDDLEWARE ====================

// 1. Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
};
app.use(cors(corsOptions));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// 4. Speed limiting (slow down repeated requests)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
});
app.use(speedLimiter);

// 5. Body parsing middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
    parameterLimit: 1000,
  })
);

// 6. Cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET || "your-secret-key"));

// 7. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 8. Data sanitization against XSS
app.use(xss());

// 9. Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["filter", "sort", "page", "limit", "fields"],
  })
);

// 10. Compression middleware
app.use(compression());

// ==================== LOGGING MIDDLEWARE ====================

// Request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(requestLogger);
}

// ==================== REQUEST VALIDATION ====================

// Global request validation middleware
app.use(validateRequest);

// ==================== ROUTES ====================

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes (to be added)
app.use("/api/v1", require("./routes"));

// ==================== STATIC FILES ====================

// Serve static files (if needed)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==================== GRACEFUL SHUTDOWN ====================

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// ==================== UNCAUGHT EXCEPTION HANDLING ====================

process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  logger.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! 💥 Shutting down...");
  logger.error(err.name, err.message);
  logger.error(err.stack);
  server.close(() => {
    process.exit(1);
  });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(
        `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      logger.info(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

const server = startServer();

module.exports = server;
