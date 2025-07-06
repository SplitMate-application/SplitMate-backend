# Database Schemas Documentation

This document provides comprehensive documentation for all database schemas used in the SplitWise-like application.

## Table of Contents

1. [User Schema](#user-schema)
2. [Group Schema](#group-schema)
3. [Expense Schema](#expense-schema)
4. [Settlement Schema](#settlement-schema)
5. [Schema Relationships](#schema-relationships)
6. [Indexes and Performance](#indexes-and-performance)
7. [Validation Rules](#validation-rules)

## User Schema

The User schema represents application users with comprehensive profile, security, and social features.

### Key Features

- **Authentication**: Password hashing, JWT token generation, login attempt tracking
- **Profile Management**: Personal info, avatar, preferences, privacy settings
- **Social Features**: Friends system, friend requests, activity tracking
- **Security**: Two-factor authentication, account locking, verification tokens
- **Financial**: Payment methods, default currency, split preferences

### Core Fields

```javascript
{
  // Basic Information
  username: String (unique, 3-30 chars, alphanumeric + underscore)
  email: String (unique, validated email format)
  password: String (min 8 chars, hashed with bcrypt)

  // Personal Information
  firstName: String (required, max 50 chars)
  lastName: String (required, max 50 chars)
  displayName: String (optional, max 100 chars)
  bio: String (max 500 chars)

  // Profile & Media
  avatar: String (URL to profile image)
  coverPhoto: String (URL to cover image)

  // Contact & Location
  phoneNumber: String (validated phone format)
  location: {
    city: String,
    country: String,
    timezone: String (default: 'UTC')
  }

  // Preferences
  preferences: {
    currency: String (enum: USD, EUR, GBP, etc.)
    language: String (enum: en, es, fr, etc.)
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean,
      expenseReminders: Boolean,
      paymentReminders: Boolean,
      groupUpdates: Boolean
    },
    privacy: {
      profileVisibility: String (enum: public, friends, private)
      showEmail: Boolean,
      showPhone: Boolean,
      allowFriendRequests: Boolean
    },
    defaultSplitMethod: String (enum: equal, percentage, fixed, shares)
  }

  // Social Features
  friends: [{
    user: ObjectId (ref: User),
    status: String (enum: pending, accepted, blocked),
    addedAt: Date
  }],

  friendRequests: [{
    from: ObjectId (ref: User),
    status: String (enum: pending, accepted, rejected),
    sentAt: Date
  }]

  // Financial Information
  paymentMethods: [{
    type: String (enum: bank, card, paypal, etc.),
    name: String,
    accountNumber: String,
    lastFour: String,
    isDefault: Boolean,
    isActive: Boolean,
    addedAt: Date
  }]

  // Security & Verification
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  loginAttempts: Number,
  lockUntil: Date,
  twoFactorEnabled: Boolean,
  twoFactorSecret: String

  // Account Status
  isActive: Boolean,
  isDeleted: Boolean,
  deletedAt: Date

  // Statistics
  stats: {
    totalExpenses: Number,
    totalGroups: Number,
    totalFriends: Number,
    totalSettlements: Number
  }
}
```

### Virtual Fields

- `fullName`: Returns `${firstName} ${lastName}`
- `displayNameOrFullName`: Returns displayName or falls back to fullName
- `accountAge`: Returns account age in days

### Instance Methods

- `comparePassword(candidatePassword)`: Compare password with hash
- `generateAuthToken()`: Generate JWT access token
- `generateRefreshToken()`: Generate JWT refresh token
- `generatePasswordResetToken()`: Generate password reset token
- `generateEmailVerificationToken()`: Generate email verification token
- `generatePhoneVerificationCode()`: Generate 6-digit verification code
- `incLoginAttempts()`: Increment failed login attempts
- `resetLoginAttempts()`: Reset login attempts counter
- `isLocked()`: Check if account is locked
- `softDelete()`: Soft delete user account
- `restore()`: Restore soft-deleted account

### Static Methods

- `findActive()`: Find all active users
- `findByEmailOrUsername(emailOrUsername)`: Find user by email or username
- `emailExists(email)`: Check if email exists
- `usernameExists(username)`: Check if username exists

## Group Schema

The Group schema represents expense groups where users can share expenses.

### Key Features

- **Group Management**: Members, roles, invitations, settings
- **Expense Organization**: Categories, tags, default split methods
- **Social Features**: Member management, role-based permissions
- **Statistics**: Expense tracking, activity monitoring

### Core Fields

```javascript
{
  // Basic Information
  name: String (required, max 100 chars)
  description: String (max 500 chars)
  type: String (enum: trip, house, event, project, other)
  image: String (URL to group image)

  // Group Settings
  settings: {
    currency: String (enum: USD, EUR, GBP, etc.)
    defaultSplitMethod: String (enum: equal, percentage, fixed, shares)
    allowMemberInvites: Boolean,
    requireApproval: Boolean,
    autoSettle: Boolean,
    settlementThreshold: Number
  }

  // Members
  members: [{
    user: ObjectId (ref: User, required),
    role: String (enum: admin, member, viewer),
    joinedAt: Date,
    isActive: Boolean,
    defaultShare: Number
  }]

  // Invitations
  invitations: [{
    email: String (required, lowercase),
    invitedBy: ObjectId (ref: User, required),
    role: String (enum: admin, member, viewer),
    invitedAt: Date,
    expiresAt: Date (7 days from invitation),
    status: String (enum: pending, accepted, declined, expired)
  }]

  // Statistics
  stats: {
    totalExpenses: Number,
    totalAmount: Number,
    totalSettlements: Number,
    lastActivity: Date
  }

  // Status
  isActive: Boolean,
  isArchived: Boolean,
  archivedAt: Date

  // Categories & Tags
  categories: [{
    name: String (required),
    color: String (hex color),
    icon: String (emoji),
    isDefault: Boolean
  }],

  tags: [{
    name: String,
    color: String (hex color)
  }]
}
```

### Virtual Fields

- `memberCount`: Returns number of active members
- `adminCount`: Returns number of admin members
- `pendingInvitationsCount`: Returns number of pending invitations

### Instance Methods

- `addMember(userId, role)`: Add user to group
- `removeMember(userId)`: Remove user from group
- `changeMemberRole(userId, newRole)`: Change member role
- `inviteUser(email, invitedBy, role)`: Invite user to group
- `acceptInvitation(email)`: Accept group invitation
- `declineInvitation(email)`: Decline group invitation
- `archive()`: Archive group
- `restore()`: Restore archived group
- `isMember(userId)`: Check if user is member
- `isAdmin(userId)`: Check if user is admin
- `getMemberRole(userId)`: Get user's role in group

### Static Methods

- `findByUser(userId)`: Find groups by user membership
- `findActive()`: Find all active groups

## Expense Schema

The Expense schema represents individual expenses with detailed split information.

### Key Features

- **Expense Tracking**: Amount, currency, date, location, category
- **Split Management**: Multiple split methods (equal, percentage, fixed, shares)
- **Settlement Tracking**: Payment status, settlement history
- **Attachments**: Receipts, file uploads
- **Recurring Expenses**: Support for recurring expense patterns

### Core Fields

```javascript
{
  // Basic Information
  title: String (required, max 200 chars)
  description: String (max 1000 chars)
  amount: Number (required, min 0.01)
  currency: String (enum: USD, EUR, GBP, etc.)

  // Date and Location
  date: Date (required, default: now)
  location: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }

  // Category and Tags
  category: {
    name: String (required),
    color: String (hex color),
    icon: String (emoji)
  },

  tags: [{
    name: String,
    color: String (hex color)
  }]

  // Group and Payment
  group: ObjectId (ref: Group, required)
  paidBy: {
    user: ObjectId (ref: User, required),
    amount: Number (required)
  }

  // Split Information
  splitMethod: String (enum: equal, percentage, fixed, shares, required)
  splits: [{
    user: ObjectId (ref: User, required),
    amount: Number (required, min 0),
    percentage: Number (min 0, max 100),
    shares: Number (min 0, default: 1),
    isPaid: Boolean (default: false),
    paidAt: Date,
    paidTo: ObjectId (ref: User)
  }]

  // Attachments
  receipt: {
    url: String,
    filename: String,
    uploadedAt: Date
  },

  attachments: [{
    url: String,
    filename: String,
    type: String,
    size: Number,
    uploadedAt: Date
  }]

  // Recurring Expense
  isRecurring: Boolean (default: false)
  recurring: {
    frequency: String (enum: daily, weekly, monthly, yearly),
    interval: Number (min 1, default: 1),
    endDate: Date,
    nextDueDate: Date,
    isActive: Boolean (default: true)
  }

  // Settlements
  settlements: [{
    from: ObjectId (ref: User, required),
    to: ObjectId (ref: User, required),
    amount: Number (required),
    method: String (enum: cash, bank, card, paypal, etc.),
    status: String (enum: pending, completed, cancelled),
    settledAt: Date,
    notes: String
  }]

  // Status and Audit
  status: String (enum: active, settled, cancelled, archived)
  createdBy: ObjectId (ref: User, required)
  lastModifiedBy: ObjectId (ref: User)

  // Statistics
  stats: {
    totalSettled: Number,
    pendingAmount: Number,
    settlementCount: Number
  }
}
```

### Virtual Fields

- `totalSettled`: Returns total amount settled
- `pendingAmount`: Returns amount still pending
- `isFullySettled`: Returns true if expense is fully settled
- `splitCount`: Returns number of splits

### Instance Methods

- `addSplit(userId, amount, percentage, shares)`: Add or update split
- `removeSplit(userId)`: Remove split for user
- `markSplitAsPaid(userId, paidTo)`: Mark split as paid
- `addSettlement(from, to, amount, method, notes)`: Add settlement
- `completeSettlement(settlementId)`: Complete settlement
- `cancelSettlement(settlementId)`: Cancel settlement
- `settleExpense()`: Mark expense as settled
- `archiveExpense()`: Archive expense
- `getUserShare(userId)`: Get user's share amount
- `getUserPercentage(userId)`: Get user's percentage
- `calculateEqualSplits(userIds)`: Calculate equal splits
- `calculatePercentageSplits(splits)`: Calculate percentage splits
- `calculateFixedSplits(splits)`: Calculate fixed amount splits
- `calculateShareSplits(splits)`: Calculate share-based splits

### Static Methods

- `findByGroup(groupId)`: Find expenses by group
- `findByUser(userId)`: Find expenses by user
- `findActive()`: Find active expenses
- `findRecurring()`: Find recurring expenses

## Settlement Schema

The Settlement schema represents payments between users to settle debts.

### Key Features

- **Payment Tracking**: Amount, method, status, due dates
- **Dispute Management**: Dispute handling and resolution
- **Reminders**: Automated reminder system
- **Related Expenses**: Link settlements to specific expenses
- **Priority Management**: Priority levels for settlements

### Core Fields

```javascript
{
  // Basic Information
  title: String (required, max 200 chars)
  description: String (max 1000 chars)

  // Parties
  from: ObjectId (ref: User, required)
  to: ObjectId (ref: User, required)
  amount: Number (required, min 0.01)
  currency: String (enum: USD, EUR, GBP, etc.)

  // Payment Method
  paymentMethod: {
    type: String (enum: cash, bank, card, paypal, etc., required),
    details: {
      accountNumber: String,
      transactionId: String,
      reference: String
    }
  }

  // Status and Dates
  status: String (enum: pending, completed, cancelled, disputed)
  dueDate: Date (default: 7 days from creation)
  completedAt: Date,
  cancelledAt: Date

  // Related Expenses
  relatedExpenses: [{
    expense: ObjectId (ref: Expense),
    amount: Number (required)
  }]

  // Group Context
  group: ObjectId (ref: Group)

  // Reminders
  reminders: [{
    type: String (enum: email, push, sms, required),
    sentAt: Date,
    status: String (enum: sent, delivered, failed)
  }]

  // Dispute Information
  dispute: {
    isDisputed: Boolean (default: false),
    disputedBy: ObjectId (ref: User),
    disputedAt: Date,
    reason: String,
    resolution: String,
    resolvedAt: Date,
    resolvedBy: ObjectId (ref: User)
  }

  // Audit Information
  createdBy: ObjectId (ref: User, required)
  lastModifiedBy: ObjectId (ref: User)

  // Additional Fields
  isAutoSettlement: Boolean (default: false)
  priority: String (enum: low, medium, high, urgent)
}
```

### Virtual Fields

- `daysOverdue`: Returns days overdue if settlement is overdue
- `isOverdue`: Returns true if settlement is overdue
- `daysUntilDue`: Returns days until due date
- `totalRelatedAmount`: Returns total amount from related expenses

### Instance Methods

- `complete(completedBy)`: Complete settlement
- `cancel(cancelledBy, reason)`: Cancel settlement
- `dispute(disputedBy, reason)`: Dispute settlement
- `resolveDispute(resolvedBy, resolution)`: Resolve dispute
- `addReminder(type)`: Add reminder
- `addRelatedExpense(expenseId, amount)`: Add related expense
- `removeRelatedExpense(expenseId)`: Remove related expense
- `updatePaymentMethod(type, details)`: Update payment method
- `extendDueDate(days)`: Extend due date

### Static Methods

- `findByUser(userId)`: Find settlements by user
- `findPending()`: Find pending settlements
- `findOverdue()`: Find overdue settlements
- `findBetweenUsers(user1Id, user2Id)`: Find settlements between users
- `findByGroup(groupId)`: Find settlements by group
- `findDisputed()`: Find disputed settlements
- `calculateBalance(user1Id, user2Id)`: Calculate balance between users
- `findDueSoon(days)`: Find settlements due soon

## Schema Relationships

### One-to-Many Relationships

- **User → Groups**: A user can be a member of multiple groups
- **User → Expenses**: A user can create multiple expenses
- **User → Settlements**: A user can be involved in multiple settlements
- **Group → Expenses**: A group can have multiple expenses
- **Group → Settlements**: A group can have multiple settlements

### Many-to-Many Relationships

- **Users ↔ Users**: Friends and friend requests
- **Users ↔ Groups**: Group membership with roles
- **Users ↔ Expenses**: Expense splits and payments

### Referential Integrity

All ObjectId references are properly indexed and include population methods for efficient querying.

## Indexes and Performance

### User Indexes

- `email`: For login and email lookups
- `username`: For username lookups
- `friends.user`: For friend queries
- `friendRequests.from`: For friend request queries
- `isActive, isDeleted`: For active user filtering
- `createdAt`: For chronological ordering

### Group Indexes

- `members.user`: For group membership queries
- `invitations.email`: For invitation lookups
- `isActive, isArchived`: For active group filtering
- `createdAt`: For chronological ordering
- `stats.lastActivity`: For activity-based sorting

### Expense Indexes

- `group`: For group expense queries
- `paidBy.user`: For expense creator queries
- `splits.user`: For user split queries
- `date`: For chronological ordering
- `status`: For status filtering
- `category.name`: For category filtering
- `isRecurring, recurring.nextDueDate`: For recurring expense queries

### Settlement Indexes

- `from, to`: For user-to-user settlement queries
- `group`: For group settlement queries
- `status`: For status filtering
- `dueDate`: For due date queries
- `dispute.isDisputed`: For dispute queries
- Compound indexes for common query patterns

## Validation Rules

### User Validation

- **Username**: 3-30 characters, alphanumeric + underscore only
- **Email**: Valid email format, unique
- **Password**: Minimum 8 characters, strong password pattern
- **Phone**: Valid phone number format
- **Names**: Maximum 50 characters each

### Group Validation

- **Name**: Required, maximum 100 characters
- **Description**: Maximum 500 characters
- **Member roles**: Valid enum values (admin, member, viewer)
- **Invitation expiration**: 7 days from creation

### Expense Validation

- **Title**: Required, maximum 200 characters
- **Amount**: Required, minimum 0.01
- **Split amounts**: Must sum to total expense amount
- **Percentages**: Must sum to 100%
- **Shares**: Must be positive numbers

### Settlement Validation

- **Amount**: Required, minimum 0.01
- **Due date**: Default 7 days from creation
- **Payment method**: Valid enum value
- **Status transitions**: Valid state transitions

### Currency Support

All monetary fields support multiple currencies:

- USD, EUR, GBP, CAD, AUD, INR, JPY, CNY, BRL, MXN

### Date Handling

- All dates are stored as UTC
- Timezone information is preserved in user preferences
- Date comparisons use proper timezone handling

This comprehensive schema design provides a solid foundation for a SplitWise-like application with robust data modeling, efficient querying, and proper validation.
