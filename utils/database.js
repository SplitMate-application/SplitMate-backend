const mongoose = require("mongoose");
const { logger } = require("./logger");

// MongoDB connection options
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  autoIndex: process.env.NODE_ENV !== "production", // Build indexes in development
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI,
      connectOptions
    );

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed through app termination");
        process.exit(0);
      } catch (err) {
        logger.error("Error closing MongoDB connection:", err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection closed");
  } catch (error) {
    logger.error("Error closing MongoDB connection:", error);
  }
};

// Get connection status
const getConnectionStatus = () => {
  return {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    models: Object.keys(mongoose.connection.models),
  };
};

// Health check for database
const healthCheck = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Ping the database
      await mongoose.connection.db.admin().ping();
      return {
        status: "healthy",
        message: "Database connection is healthy",
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: "unhealthy",
        message: "Database connection is not ready",
        readyState: mongoose.connection.readyState,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Database health check failed",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus,
  healthCheck,
};
