// Global test setup
const request = require("supertest");

// Increase timeout for all tests
jest.setTimeout(10000);

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    username: "testuser",
    email: "test@example.com",
    password: "TestPass123!",
    confirmPassword: "TestPass123!",
    firstName: "Test",
    lastName: "User",
    ...overrides,
  }),

  // Helper to create test login data
  createTestLogin: (overrides = {}) => ({
    email: "test@example.com",
    password: "TestPass123!",
    ...overrides,
  }),

  // Helper to validate response structure
  validateResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty("success");
    expect(typeof response.body.success).toBe("boolean");
  },

  // Helper to validate error response
  validateErrorResponse: (response, expectedStatus = 400) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("message");
  },

  // Helper to validate success response
  validateSuccessResponse: (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(true);
  },
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global beforeAll and afterAll hooks
beforeAll(() => {
  // Setup any global test environment
});

afterAll(() => {
  // Cleanup any global test environment
});
