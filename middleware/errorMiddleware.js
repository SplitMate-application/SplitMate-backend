const { logger } = require("../utils/logger");

// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(err);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    error = { message, statusCode: 429 };
  }

  // XSS errors
  if (err.message && err.message.includes("XSS")) {
    const message = "XSS attack detected";
    error = { message, statusCode: 400 };
  }

  // SQL injection errors
  if (err.message && err.message.includes("SQL")) {
    const message = "Invalid input detected";
    error = { message, statusCode: 400 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Don't leak error details in production
  const response = {
    success: false,
    error: {
      message:
        process.env.NODE_ENV === "production" && statusCode === 500
          ? "Internal Server Error"
          : message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  };

  // Add additional info in development
  if (process.env.NODE_ENV === "development") {
    response.error.timestamp = new Date().toISOString();
    response.error.path = req.path;
    response.error.method = req.method;
  }

  res.status(statusCode).json(response);
};

module.exports = {
  notFound,
  errorHandler,
};
