const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Settlement title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    // Parties Involved
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "From user is required"],
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "To user is required"],
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

    // Payment Method
    paymentMethod: {
      type: {
        type: String,
        enum: ["cash", "bank", "card", "paypal", "venmo", "cashapp", "other"],
        required: [true, "Payment method is required"],
      },
      details: {
        accountNumber: String,
        transactionId: String,
        reference: String,
      },
    },

    // Status and Dates
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "disputed"],
      default: "pending",
    },

    dueDate: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      },
    },

    completedAt: Date,
    cancelledAt: Date,

    // Related Expenses
    relatedExpenses: [
      {
        expense: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Expense",
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],

    // Group Context
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    // Notes and Comments
    notes: {
      type: String,
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },

    // Attachments
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

    // Reminders
    reminders: [
      {
        type: {
          type: String,
          enum: ["email", "push", "sms"],
          required: true,
        },
        sentAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["sent", "delivered", "failed"],
          default: "sent",
        },
      },
    ],

    // Dispute Information
    dispute: {
      isDisputed: {
        type: Boolean,
        default: false,
      },
      disputedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      disputedAt: Date,
      reason: String,
      resolution: String,
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
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

    // Auto-settlement flag
    isAutoSettlement: {
      type: Boolean,
      default: false,
    },

    // Priority
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for days overdue
settlementSchema.virtual("daysOverdue").get(function () {
  if (this.status === "pending" && this.dueDate < new Date()) {
    return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for is overdue
settlementSchema.virtual("isOverdue").get(function () {
  return this.status === "pending" && this.dueDate < new Date();
});

// Virtual for days until due
settlementSchema.virtual("daysUntilDue").get(function () {
  if (this.status === "pending" && this.dueDate > new Date()) {
    return Math.floor((this.dueDate - new Date()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total related expense amount
settlementSchema.virtual("totalRelatedAmount").get(function () {
  return this.relatedExpenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );
});

// Indexes for better query performance
settlementSchema.index({ from: 1 });
settlementSchema.index({ to: 1 });
settlementSchema.index({ group: 1 });
settlementSchema.index({ status: 1 });
settlementSchema.index({ dueDate: 1 });
settlementSchema.index({ createdAt: -1 });
settlementSchema.index({ "dispute.isDisputed": 1 });
settlementSchema.index({ isAutoSettlement: 1 });

// Compound indexes
settlementSchema.index({ from: 1, to: 1 });
settlementSchema.index({ from: 1, status: 1 });
settlementSchema.index({ to: 1, status: 1 });
settlementSchema.index({ group: 1, status: 1 });

// Pre-save middleware
settlementSchema.pre("save", function (next) {
  // Set completedAt when status changes to completed
  if (
    this.isModified("status") &&
    this.status === "completed" &&
    !this.completedAt
  ) {
    this.completedAt = new Date();
  }

  // Set cancelledAt when status changes to cancelled
  if (
    this.isModified("status") &&
    this.status === "cancelled" &&
    !this.cancelledAt
  ) {
    this.cancelledAt = new Date();
  }

  next();
});

// Instance method to complete settlement
settlementSchema.methods.complete = function (completedBy = null) {
  this.status = "completed";
  this.completedAt = new Date();
  if (completedBy) {
    this.lastModifiedBy = completedBy;
  }
  return this.save();
};

// Instance method to cancel settlement
settlementSchema.methods.cancel = function (cancelledBy = null, reason = "") {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  if (cancelledBy) {
    this.lastModifiedBy = cancelledBy;
  }
  if (reason) {
    this.notes = reason;
  }
  return this.save();
};

// Instance method to dispute settlement
settlementSchema.methods.dispute = function (disputedBy, reason) {
  this.dispute.isDisputed = true;
  this.dispute.disputedBy = disputedBy;
  this.dispute.disputedAt = new Date();
  this.dispute.reason = reason;
  this.status = "disputed";
  this.lastModifiedBy = disputedBy;
  return this.save();
};

// Instance method to resolve dispute
settlementSchema.methods.resolveDispute = function (resolvedBy, resolution) {
  this.dispute.resolution = resolution;
  this.dispute.resolvedAt = new Date();
  this.dispute.resolvedBy = resolvedBy;
  this.dispute.isDisputed = false;
  this.status = "pending";
  this.lastModifiedBy = resolvedBy;
  return this.save();
};

// Instance method to add reminder
settlementSchema.methods.addReminder = function (type) {
  this.reminders.push({
    type,
    sentAt: new Date(),
    status: "sent",
  });
  return this.save();
};

// Instance method to add related expense
settlementSchema.methods.addRelatedExpense = function (expenseId, amount) {
  this.relatedExpenses.push({
    expense: expenseId,
    amount,
  });
  return this.save();
};

// Instance method to remove related expense
settlementSchema.methods.removeRelatedExpense = function (expenseId) {
  this.relatedExpenses = this.relatedExpenses.filter(
    (exp) => exp.expense.toString() !== expenseId.toString()
  );
  return this.save();
};

// Instance method to update payment method
settlementSchema.methods.updatePaymentMethod = function (type, details = {}) {
  this.paymentMethod = {
    type,
    details,
  };
  return this.save();
};

// Instance method to extend due date
settlementSchema.methods.extendDueDate = function (days) {
  this.dueDate = new Date(this.dueDate.getTime() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

// Static method to find settlements by user
settlementSchema.statics.findByUser = function (userId) {
  return this.find({
    $or: [{ from: userId }, { to: userId }],
  })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .populate("group", "name image")
    .sort({ createdAt: -1 });
};

// Static method to find pending settlements
settlementSchema.statics.findPending = function () {
  return this.find({ status: "pending" })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .sort({ dueDate: 1 });
};

// Static method to find overdue settlements
settlementSchema.statics.findOverdue = function () {
  return this.find({
    status: "pending",
    dueDate: { $lt: new Date() },
  })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .sort({ dueDate: 1 });
};

// Static method to find settlements between two users
settlementSchema.statics.findBetweenUsers = function (user1Id, user2Id) {
  return this.find({
    $or: [
      { from: user1Id, to: user2Id },
      { from: user2Id, to: user1Id },
    ],
  })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .sort({ createdAt: -1 });
};

// Static method to find settlements by group
settlementSchema.statics.findByGroup = function (groupId) {
  return this.find({ group: groupId })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .sort({ createdAt: -1 });
};

// Static method to find disputed settlements
settlementSchema.statics.findDisputed = function () {
  return this.find({ "dispute.isDisputed": true })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .populate("dispute.disputedBy", "username firstName lastName")
    .sort({ "dispute.disputedAt": -1 });
};

// Static method to calculate total balance between users
settlementSchema.statics.calculateBalance = async function (user1Id, user2Id) {
  const settlements = await this.find({
    $or: [
      { from: user1Id, to: user2Id },
      { from: user2Id, to: user1Id },
    ],
    status: "completed",
  });

  let balance = 0;

  settlements.forEach((settlement) => {
    if (settlement.from.toString() === user1Id.toString()) {
      balance -= settlement.amount;
    } else {
      balance += settlement.amount;
    }
  });

  return balance;
};

// Static method to find settlements due soon
settlementSchema.statics.findDueSoon = function (days = 3) {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);

  return this.find({
    status: "pending",
    dueDate: { $lte: dueDate, $gt: new Date() },
  })
    .populate("from", "username firstName lastName avatar")
    .populate("to", "username firstName lastName avatar")
    .sort({ dueDate: 1 });
};

module.exports = mongoose.model("Settlement", settlementSchema);
