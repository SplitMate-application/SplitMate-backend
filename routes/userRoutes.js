const express = require("express");
const { body, param } = require("express-validator");
const {
  validateWithJoi,
  commonSchemas,
  sanitizeInput,
} = require("../middleware/validationMiddleware");
const { logSecurityEvent } = require("../utils/logger");
const Joi = require("joi");

const router = express.Router();

// User update validation schema
const userUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).optional(),
  email: Joi.string().email().max(255).optional(),
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  bio: Joi.string().max(500).optional(),
  avatar: Joi.string().uri().optional(),
});

// Password change validation schema
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: commonSchemas.password,
  confirmNewPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords must match",
    }),
});

// Get current user profile
router.get("/profile", (req, res) => {
  // TODO: Implement authentication middleware
  // TODO: Get user from database

  res.json({
    success: true,
    data: {
      user: {
        id: "temp-user-id",
        username: "tempuser",
        email: "temp@example.com",
        firstName: "Temp",
        lastName: "User",
        bio: "This is a temporary user profile",
        avatar: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
  });
});

// Update user profile
router.put(
  "/profile",
  [
    sanitizeInput,
    validateWithJoi(userUpdateSchema),
    body("username").optional().isLength({ min: 3, max: 30 }).isAlphanumeric(),
    body("email").optional().isEmail().normalizeEmail(),
    body("firstName").optional().isLength({ max: 50 }).trim().escape(),
    body("lastName").optional().isLength({ max: 50 }).trim().escape(),
    body("bio").optional().isLength({ max: 500 }).trim().escape(),
  ],
  (req, res) => {
    // Log profile update attempt
    logSecurityEvent("profile_update_attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      updatedFields: Object.keys(req.body),
    });

    // TODO: Implement actual profile update logic
    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: "temp-user-id",
          ...req.body,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }
);

// Change password
router.put(
  "/change-password",
  [
    sanitizeInput,
    validateWithJoi(passwordChangeSchema),
    body("currentPassword").isLength({ min: 1 }),
    body("newPassword")
      .isLength({ min: 8 })
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
      ),
    body("confirmNewPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    }),
  ],
  (req, res) => {
    // Log password change attempt
    logSecurityEvent("password_change_attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // TODO: Implement actual password change logic
    res.json({
      success: true,
      message: "Password changed successfully",
    });
  }
);

// Delete user account
router.delete(
  "/account",
  [
    body("password")
      .isLength({ min: 1 })
      .withMessage("Password is required to delete account"),
    body("confirmDelete")
      .equals("DELETE")
      .withMessage("Type DELETE to confirm account deletion"),
  ],
  (req, res) => {
    // Log account deletion attempt
    logSecurityEvent("account_deletion_attempt", {
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    // TODO: Implement actual account deletion logic
    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  }
);

// Get user by ID (public profile)
router.get(
  "/:userId",
  [param("userId").isMongoId().withMessage("Invalid user ID")],
  (req, res) => {
    // TODO: Implement actual user retrieval logic
    res.json({
      success: true,
      data: {
        user: {
          id: req.params.userId,
          username: "publicuser",
          firstName: "Public",
          lastName: "User",
          bio: "This is a public user profile",
          avatar: null,
          createdAt: new Date().toISOString(),
        },
      },
    });
  }
);

// Upload avatar
router.post("/avatar", (req, res) => {
  // TODO: Implement file upload middleware
  // TODO: Implement avatar upload logic

  res.json({
    success: true,
    message: "Avatar upload endpoint - implement upload logic",
    data: {
      avatarUrl: "https://example.com/avatar.jpg",
    },
  });
});

// Get user activity/logs
router.get(
  "/activity",
  [
    body("page").optional().isInt({ min: 1 }),
    body("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  (req, res) => {
    // TODO: Implement authentication middleware
    // TODO: Get user activity from database

    res.json({
      success: true,
      data: {
        activities: [
          {
            id: "activity-1",
            type: "login",
            description: "User logged in",
            timestamp: new Date().toISOString(),
            ip: req.ip,
          },
          {
            id: "activity-2",
            type: "profile_update",
            description: "Profile updated",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            ip: req.ip,
          },
        ],
        pagination: {
          page: parseInt(req.query.page) || 1,
          limit: parseInt(req.query.limit) || 10,
          total: 2,
        },
      },
    });
  }
);

module.exports = router;
