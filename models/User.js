const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default
    },

    // Personal Information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: [100, "Display name cannot exceed 100 characters"],
    },

    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },

    // Profile & Media
    avatar: {
      type: String,
      default: null,
    },

    coverPhoto: {
      type: String,
      default: null,
    },

    // Contact Information
    phoneNumber: {
      type: String,
      match: [/^\+?[\d\s\-\(\)]+$/, "Please enter a valid phone number"],
    },

    // Location
    location: {
      city: String,
      country: String,
      timezone: {
        type: String,
        default: "UTC",
      },
    },

    // Preferences & Settings
    preferences: {
      currency: {
        type: String,
        default: "USD",
        enum: [
          "USD",
          "EUR",
          "GBP",
          "CAD",
          "AUD",
          "INR",
          "JPY",
          "CNY",
          "BRL",
          "MXN",
        ],
      },

      language: {
        type: String,
        default: "en",
        enum: ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko"],
      },

      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sms: {
          type: Boolean,
          default: false,
        },
        expenseReminders: {
          type: Boolean,
          default: true,
        },
        paymentReminders: {
          type: Boolean,
          default: true,
        },
        groupUpdates: {
          type: Boolean,
          default: true,
        },
      },

      privacy: {
        profileVisibility: {
          type: String,
          enum: ["public", "friends", "private"],
          default: "friends",
        },
        showEmail: {
          type: Boolean,
          default: false,
        },
        showPhone: {
          type: Boolean,
          default: false,
        },
        allowFriendRequests: {
          type: Boolean,
          default: true,
        },
      },

      defaultSplitMethod: {
        type: String,
        enum: ["equal", "percentage", "fixed", "shares"],
        default: "equal",
      },
    },

    // Social Features
    friends: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "blocked"],
          default: "pending",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    friendRequests: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Financial Information
    defaultPaymentMethod: {
      type: {
        type: String,
        enum: ["bank", "card", "paypal", "venmo", "cashapp", "other"],
        default: "bank",
      },
      name: String,
      lastFour: String,
      isDefault: {
        type: Boolean,
        default: false,
      },
    },

    paymentMethods: [
      {
        type: {
          type: String,
          enum: ["bank", "card", "paypal", "venmo", "cashapp", "other"],
        },
        name: String,
        accountNumber: String,
        lastFour: String,
        isDefault: {
          type: Boolean,
          default: false,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Account Status & Verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,
    emailVerificationExpires: Date,

    phoneVerificationCode: String,
    phoneVerificationExpires: Date,

    // Security
    passwordResetToken: String,
    passwordResetExpires: Date,

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: String,

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,

    // Timestamps
    lastLoginAt: Date,
    lastActivityAt: Date,

    // Statistics
    stats: {
      totalExpenses: {
        type: Number,
        default: 0,
      },
      totalGroups: {
        type: Number,
        default: 0,
      },
      totalFriends: {
        type: Number,
        default: 0,
      },
      totalSettlements: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name (falls back to full name if not set)
userSchema.virtual("displayNameOrFullName").get(function () {
  return this.displayName || this.fullName;
});

// Virtual for account age
userSchema.virtual("accountAge").get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ "friends.user": 1 });
userSchema.index({ "friendRequests.from": 1 });
userSchema.index({ isActive: 1, isDeleted: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update lastActivityAt
userSchema.pre("save", function (next) {
  this.lastActivityAt = new Date();
  next();
});

// Instance method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
      type: "refresh",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    }
  );
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Instance method to generate phone verification code
userSchema.methods.generatePhoneVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  this.phoneVerificationCode = code;
  this.phoneVerificationExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return code;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  });
};

// Instance method to soft delete user
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Instance method to restore user
userSchema.methods.restore = function () {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.isActive = true;
  return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true, isDeleted: false });
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = function (emailOrUsername) {
  return this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername },
    ],
    isActive: true,
    isDeleted: false,
  });
};

// Static method to check if email exists
userSchema.statics.emailExists = function (email) {
  return this.exists({
    email: email.toLowerCase(),
    isDeleted: false,
  });
};

// Static method to check if username exists
userSchema.statics.usernameExists = function (username) {
  return this.exists({
    username,
    isDeleted: false,
  });
};

module.exports = mongoose.model("User", userSchema);
