// Set test environment variables
process.env.NODE_ENV = "test";
process.env.PORT = 5001;
process.env.COOKIE_SECRET = "test-cookie-secret";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.MONGODB_URI = "mongodb://localhost:27017/splitmate-test";
process.env.REDIS_URL = "redis://localhost:6379/1";
process.env.LOG_LEVEL = "error";
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
process.env.RATE_LIMIT_MAX_REQUESTS = 1000;
process.env.SPEED_LIMIT_DELAY_AFTER = 1000;
process.env.SPEED_LIMIT_DELAY_MS = 100;
