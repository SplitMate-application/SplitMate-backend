const { validationResult } = require("express-validator");
const Joi = require("joi");
const { logSecurityEvent } = require("../utils/logger");

// Global request validation middleware
const validateRequest = (req, res, next) => {
  // Check for validation errors from express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);

    // Log validation failure as potential security event
    logSecurityEvent("validation_failure", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      path: req.path,
      method: req.method,
      errors: errorMessages,
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: errorMessages,
      },
    });
  }

  next();
};

// Joi validation middleware factory
const validateWithJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);

      // Log validation failure
      logSecurityEvent("joi_validation_failure", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        path: req.path,
        method: req.method,
        errors: errorMessages,
        body: req.body,
      });

      return res.status(400).json({
        success: false,
        error: {
          message: "Validation failed",
          details: errorMessages,
        },
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // Email validation
  email: Joi.string().email().max(255).required(),

  // Password validation (strong password)
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password must not exceed 128 characters",
    }),

  // Username validation
  username: Joi.string().alphanum().min(3).max(30).required(),

  // ObjectId validation (for MongoDB)
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required(),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid("asc", "desc").default("desc"),
    sortBy: Joi.string().max(50).default("createdAt"),
  }),

  // Search validation
  search: Joi.object({
    q: Joi.string().max(255).allow(""),
    filter: Joi.string().max(255).allow(""),
    fields: Joi.string().max(500).allow(""),
  }),
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        // Remove potential script tags
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      }
    });
  }

  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach((key) => {
      if (typeof req.params[key] === "string") {
        req.params[key] = req.params[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "")
          .trim();
      }
    });
  }

  next();
};

// Content type validation middleware
const validateContentType = (allowedTypes = ["application/json"]) => {
  return (req, res, next) => {
    const contentType = req.get("Content-Type");

    if (!contentType) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Content-Type header is required",
        },
      });
    }

    const isValidType = allowedTypes.some((type) => contentType.includes(type));

    if (!isValidType) {
      logSecurityEvent("invalid_content_type", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        contentType,
        path: req.path,
        method: req.method,
      });

      return res.status(415).json({
        success: false,
        error: {
          message: `Content-Type must be one of: ${allowedTypes.join(", ")}`,
        },
      });
    }

    next();
  };
};

// File upload validation middleware
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ["image/jpeg", "image/png", "image/gif"],
    maxFiles = 1,
  } = options;

  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: "No files were uploaded",
        },
      });
    }

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files);

    if (files.length > maxFiles) {
      logSecurityEvent("too_many_files", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        fileCount: files.length,
        maxFiles,
      });

      return res.status(400).json({
        success: false,
        error: {
          message: `Maximum ${maxFiles} file(s) allowed`,
        },
      });
    }

    for (const file of files) {
      if (file.size > maxSize) {
        logSecurityEvent("file_too_large", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          fileSize: file.size,
          maxSize,
        });

        return res.status(400).json({
          success: false,
          error: {
            message: `File size must be less than ${Math.round(
              maxSize / 1024 / 1024
            )}MB`,
          },
        });
      }

      if (!allowedTypes.includes(file.mimetype)) {
        logSecurityEvent("invalid_file_type", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          mimetype: file.mimetype,
          allowedTypes,
        });

        return res.status(400).json({
          success: false,
          error: {
            message: `File type not allowed. Allowed types: ${allowedTypes.join(
              ", "
            )}`,
          },
        });
      }
    }

    next();
  };
};

module.exports = {
  validateRequest,
  validateWithJoi,
  commonSchemas,
  sanitizeInput,
  validateContentType,
  validateFileUpload,
};
