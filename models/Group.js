const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },

    // Group Type
    type: {
      type: String,
      enum: ["trip", "house", "event", "project", "other"],
      default: "other",
    },

    // Group Image
    image: {
      type: String,
      default: null,
    },

    // Group Settings
    settings: {
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

      defaultSplitMethod: {
        type: String,
        enum: ["equal", "percentage", "fixed", "shares"],
        default: "equal",
      },

      allowMemberInvites: {
        type: Boolean,
        default: true,
      },

      requireApproval: {
        type: Boolean,
        default: false,
      },

      autoSettle: {
        type: Boolean,
        default: false,
      },

      settlementThreshold: {
        type: Number,
        default: 0.01, // Minimum amount for auto-settlement
      },
    },

    // Members
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member", "viewer"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        defaultShare: {
          type: Number,
          default: 1, // Default share for equal splitting
        },
      },
    ],

    // Pending Invitations
    invitations: [
      {
        email: {
          type: String,
          required: true,
          lowercase: true,
        },
        invitedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "member", "viewer"],
          default: "member",
        },
        invitedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: {
          type: Date,
          default: function () {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
          },
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "declined", "expired"],
          default: "pending",
        },
      },
    ],

    // Group Statistics
    stats: {
      totalExpenses: {
        type: Number,
        default: 0,
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      totalSettlements: {
        type: Number,
        default: 0,
      },
      lastActivity: {
        type: Date,
        default: Date.now,
      },
    },

    // Group Status
    isActive: {
      type: Boolean,
      default: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    archivedAt: Date,

    // Categories (for expenses)
    categories: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        color: {
          type: String,
          default: "#3B82F6",
        },
        icon: {
          type: String,
          default: "💰",
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Tags
    tags: [
      {
        name: {
          type: String,
          trim: true,
        },
        color: {
          type: String,
          default: "#6B7280",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for member count
groupSchema.virtual("memberCount").get(function () {
  return this.members.filter((member) => member.isActive).length;
});

// Virtual for admin count
groupSchema.virtual("adminCount").get(function () {
  return this.members.filter(
    (member) => member.isActive && member.role === "admin"
  ).length;
});

// Virtual for pending invitations count
groupSchema.virtual("pendingInvitationsCount").get(function () {
  return this.invitations.filter(
    (inv) => inv.status === "pending" && inv.expiresAt > new Date()
  ).length;
});

// Indexes for better query performance
groupSchema.index({ "members.user": 1 });
groupSchema.index({ "invitations.email": 1 });
groupSchema.index({ isActive: 1, isArchived: 1 });
groupSchema.index({ createdAt: -1 });
groupSchema.index({ "stats.lastActivity": -1 });

// Pre-save middleware to update last activity
groupSchema.pre("save", function (next) {
  this.stats.lastActivity = new Date();
  next();
});

// Instance method to add member
groupSchema.methods.addMember = function (userId, role = "member") {
  const existingMember = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (existingMember) {
    existingMember.isActive = true;
    existingMember.role = role;
  } else {
    this.members.push({
      user: userId,
      role,
      joinedAt: new Date(),
      isActive: true,
    });
  }

  return this.save();
};

// Instance method to remove member
groupSchema.methods.removeMember = function (userId) {
  const memberIndex = this.members.findIndex(
    (member) => member.user.toString() === userId.toString()
  );

  if (memberIndex !== -1) {
    this.members[memberIndex].isActive = false;
  }

  return this.save();
};

// Instance method to change member role
groupSchema.methods.changeMemberRole = function (userId, newRole) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );

  if (member) {
    member.role = newRole;
  }

  return this.save();
};

// Instance method to invite user
groupSchema.methods.inviteUser = function (email, invitedBy, role = "member") {
  // Remove existing invitation for this email
  this.invitations = this.invitations.filter((inv) => inv.email !== email);

  this.invitations.push({
    email,
    invitedBy,
    role,
    invitedAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    status: "pending",
  });

  return this.save();
};

// Instance method to accept invitation
groupSchema.methods.acceptInvitation = function (email) {
  const invitation = this.invitations.find((inv) => inv.email === email);

  if (
    invitation &&
    invitation.status === "pending" &&
    invitation.expiresAt > new Date()
  ) {
    invitation.status = "accepted";
    return this.save();
  }

  return Promise.reject(new Error("Invalid or expired invitation"));
};

// Instance method to decline invitation
groupSchema.methods.declineInvitation = function (email) {
  const invitation = this.invitations.find((inv) => inv.email === email);

  if (invitation) {
    invitation.status = "declined";
    return this.save();
  }

  return Promise.reject(new Error("Invitation not found"));
};

// Instance method to archive group
groupSchema.methods.archive = function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.isActive = false;
  return this.save();
};

// Instance method to restore group
groupSchema.methods.restore = function () {
  this.isArchived = false;
  this.archivedAt = undefined;
  this.isActive = true;
  return this.save();
};

// Instance method to check if user is member
groupSchema.methods.isMember = function (userId) {
  return this.members.some(
    (member) => member.user.toString() === userId.toString() && member.isActive
  );
};

// Instance method to check if user is admin
groupSchema.methods.isAdmin = function (userId) {
  return this.members.some(
    (member) =>
      member.user.toString() === userId.toString() &&
      member.isActive &&
      member.role === "admin"
  );
};

// Instance method to get member role
groupSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find(
    (member) => member.user.toString() === userId.toString() && member.isActive
  );
  return member ? member.role : null;
};

// Static method to find groups by user
groupSchema.statics.findByUser = function (userId) {
  return this.find({
    "members.user": userId,
    "members.isActive": true,
    isActive: true,
    isArchived: false,
  }).populate("members.user", "username firstName lastName avatar");
};

// Static method to find active groups
groupSchema.statics.findActive = function () {
  return this.find({ isActive: true, isArchived: false });
};

module.exports = mongoose.model("Group", groupSchema);
