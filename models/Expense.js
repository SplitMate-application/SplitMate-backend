const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    // Amount and Currency
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

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

    // Date and Location
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },

    location: {
      name: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Category and Tags
    category: {
      name: {
        type: String,
        required: [true, "Category is required"],
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
    },

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

    // Group Information
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group is required"],
    },

    // Paid By
    paidBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Paid by user is required"],
      },
      amount: {
        type: Number,
        required: [true, "Paid amount is required"],
      },
    },

    // Split Information
    splitMethod: {
      type: String,
      enum: ["equal", "percentage", "fixed", "shares"],
      required: [true, "Split method is required"],
    },

    splits: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        shares: {
          type: Number,
          min: 0,
          default: 1,
        },
        isPaid: {
          type: Boolean,
          default: false,
        },
        paidAt: Date,
        paidTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    // Receipt and Attachments
    receipt: {
      url: String,
      filename: String,
      uploadedAt: Date,
    },

    attachments: [
      {
        url: String,
        filename: String,
        type: String,
        size: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Notes and Comments
    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    // Recurring Expense
    isRecurring: {
      type: Boolean,
      default: false,
    },

    recurring: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
        default: "monthly",
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
      },
      endDate: Date,
      nextDueDate: Date,
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    // Settlement Information
    settlements: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        method: {
          type: String,
          enum: ["cash", "bank", "card", "paypal", "venmo", "cashapp", "other"],
          default: "cash",
        },
        status: {
          type: String,
          enum: ["pending", "completed", "cancelled"],
          default: "pending",
        },
        settledAt: Date,
        notes: String,
      },
    ],

    // Status
    status: {
      type: String,
      enum: ["active", "settled", "cancelled", "archived"],
      default: "active",
    },

    // Audit Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Statistics
    stats: {
      totalSettled: {
        type: Number,
        default: 0,
      },
      pendingAmount: {
        type: Number,
        default: 0,
      },
      settlementCount: {
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

// Virtual for total settled amount
expenseSchema.virtual("totalSettled").get(function () {
  return this.settlements
    .filter((settlement) => settlement.status === "completed")
    .reduce((total, settlement) => total + settlement.amount, 0);
});

// Virtual for pending amount
expenseSchema.virtual("pendingAmount").get(function () {
  return this.amount - this.totalSettled;
});

// Virtual for is fully settled
expenseSchema.virtual("isFullySettled").get(function () {
  return this.totalSettled >= this.amount;
});

// Virtual for split count
expenseSchema.virtual("splitCount").get(function () {
  return this.splits.length;
});

// Indexes for better query performance
expenseSchema.index({ group: 1 });
expenseSchema.index({ "paidBy.user": 1 });
expenseSchema.index({ "splits.user": 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ createdAt: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ "category.name": 1 });
expenseSchema.index({ isRecurring: 1, "recurring.nextDueDate": 1 });

// Pre-save middleware to update statistics
expenseSchema.pre("save", function (next) {
  // Calculate total settled amount
  this.stats.totalSettled = this.settlements
    .filter((settlement) => settlement.status === "completed")
    .reduce((total, settlement) => total + settlement.amount, 0);

  // Calculate pending amount
  this.stats.pendingAmount = this.amount - this.stats.totalSettled;

  // Count settlements
  this.stats.settlementCount = this.settlements.length;

  next();
});

// Instance method to add split
expenseSchema.methods.addSplit = function (
  userId,
  amount,
  percentage = null,
  shares = 1
) {
  const existingSplit = this.splits.find(
    (split) => split.user.toString() === userId.toString()
  );

  if (existingSplit) {
    existingSplit.amount = amount;
    existingSplit.percentage = percentage;
    existingSplit.shares = shares;
  } else {
    this.splits.push({
      user: userId,
      amount,
      percentage,
      shares,
      isPaid: false,
    });
  }

  return this.save();
};

// Instance method to remove split
expenseSchema.methods.removeSplit = function (userId) {
  this.splits = this.splits.filter(
    (split) => split.user.toString() !== userId.toString()
  );

  return this.save();
};

// Instance method to mark split as paid
expenseSchema.methods.markSplitAsPaid = function (userId, paidTo = null) {
  const split = this.splits.find(
    (split) => split.user.toString() === userId.toString()
  );

  if (split) {
    split.isPaid = true;
    split.paidAt = new Date();
    split.paidTo = paidTo;
  }

  return this.save();
};

// Instance method to add settlement
expenseSchema.methods.addSettlement = function (
  from,
  to,
  amount,
  method = "cash",
  notes = ""
) {
  this.settlements.push({
    from,
    to,
    amount,
    method,
    status: "pending",
    notes,
  });

  return this.save();
};

// Instance method to complete settlement
expenseSchema.methods.completeSettlement = function (settlementId) {
  const settlement = this.settlements.id(settlementId);

  if (settlement) {
    settlement.status = "completed";
    settlement.settledAt = new Date();
  }

  return this.save();
};

// Instance method to cancel settlement
expenseSchema.methods.cancelSettlement = function (settlementId) {
  const settlement = this.settlements.id(settlementId);

  if (settlement) {
    settlement.status = "cancelled";
  }

  return this.save();
};

// Instance method to settle expense
expenseSchema.methods.settleExpense = function () {
  this.status = "settled";
  return this.save();
};

// Instance method to archive expense
expenseSchema.methods.archiveExpense = function () {
  this.status = "archived";
  return this.save();
};

// Instance method to get user's share
expenseSchema.methods.getUserShare = function (userId) {
  const split = this.splits.find(
    (split) => split.user.toString() === userId.toString()
  );

  return split ? split.amount : 0;
};

// Instance method to get user's percentage
expenseSchema.methods.getUserPercentage = function (userId) {
  const split = this.splits.find(
    (split) => split.user.toString() === userId.toString()
  );

  return split ? split.percentage : 0;
};

// Instance method to calculate equal splits
expenseSchema.methods.calculateEqualSplits = function (userIds) {
  const amountPerPerson = this.amount / userIds.length;

  this.splits = userIds.map((userId) => ({
    user: userId,
    amount: amountPerPerson,
    percentage: 100 / userIds.length,
    shares: 1,
    isPaid: false,
  }));

  return this.save();
};

// Instance method to calculate percentage splits
expenseSchema.methods.calculatePercentageSplits = function (splits) {
  // splits should be array of { userId, percentage }
  this.splits = splits.map((split) => ({
    user: split.userId,
    amount: (this.amount * split.percentage) / 100,
    percentage: split.percentage,
    shares: 1,
    isPaid: false,
  }));

  return this.save();
};

// Instance method to calculate fixed splits
expenseSchema.methods.calculateFixedSplits = function (splits) {
  // splits should be array of { userId, amount }
  this.splits = splits.map((split) => ({
    user: split.userId,
    amount: split.amount,
    percentage: (split.amount / this.amount) * 100,
    shares: 1,
    isPaid: false,
  }));

  return this.save();
};

// Instance method to calculate share splits
expenseSchema.methods.calculateShareSplits = function (splits) {
  // splits should be array of { userId, shares }
  const totalShares = splits.reduce((total, split) => total + split.shares, 0);

  this.splits = splits.map((split) => ({
    user: split.userId,
    amount: (this.amount * split.shares) / totalShares,
    percentage: (split.shares / totalShares) * 100,
    shares: split.shares,
    isPaid: false,
  }));

  return this.save();
};

// Static method to find expenses by group
expenseSchema.statics.findByGroup = function (groupId) {
  return this.find({ group: groupId })
    .populate("paidBy.user", "username firstName lastName avatar")
    .populate("splits.user", "username firstName lastName avatar")
    .populate("createdBy", "username firstName lastName")
    .sort({ date: -1 });
};

// Static method to find expenses by user
expenseSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [{ "paidBy.user": userId }, { "splits.user": userId }],
  })
    .populate("group", "name image")
    .populate("paidBy.user", "username firstName lastName avatar")
    .populate("splits.user", "username firstName lastName avatar")
    .sort({ date: -1 });
};

// Static method to find active expenses
expenseSchema.statics.findActive = function () {
  return this.find({ status: "active" });
};

// Static method to find recurring expenses
expenseSchema.statics.findRecurring = function () {
  return this.find({
    isRecurring: true,
    "recurring.isActive": true,
    "recurring.nextDueDate": { $lte: new Date() },
  });
};

module.exports = mongoose.model("Expense", expenseSchema);
