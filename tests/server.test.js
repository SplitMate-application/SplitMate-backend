const request = require("supertest");
const app = require("../server");

describe("Server", () => {
  describe("Health Check", () => {
    it("should return 200 for health check", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "success");
      expect(response.body).toHaveProperty("message", "Server is running");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("environment");
    });
  });

  describe("API Info", () => {
    it("should return API information", async () => {
      const response = await request(app).get("/api/v1/info");

      testUtils.validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty("name", "SplitMate API");
      expect(response.body.data).toHaveProperty("version", "1.0.0");
      expect(response.body.data).toHaveProperty("endpoints");
    });
  });

  describe("Status Endpoint", () => {
    it("should return detailed status information", async () => {
      const response = await request(app).get("/api/v1/status");

      testUtils.validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty("status", "operational");
      expect(response.body.data).toHaveProperty("uptime");
      expect(response.body.data).toHaveProperty("timestamp");
      expect(response.body.data).toHaveProperty("environment");
      expect(response.body.data).toHaveProperty("version");
      expect(response.body.data).toHaveProperty("memory");
      expect(response.body.data).toHaveProperty("platform");
      expect(response.body.data).toHaveProperty("nodeVersion");
    });
  });

  describe("Ping Endpoint", () => {
    it("should return pong response", async () => {
      const response = await request(app).get("/api/v1/ping");

      testUtils.validateSuccessResponse(response);
      expect(response.body.message).toBe("pong");
      expect(response.body).toHaveProperty("timestamp");
    });
  });

  describe("Test Endpoint", () => {
    it("should return test response", async () => {
      const response = await request(app).get("/api/v1/test");

      testUtils.validateSuccessResponse(response);
      expect(response.body.message).toBe("API is working correctly");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("environment");
    });
  });

  describe("Echo Endpoint", () => {
    it("should echo request data", async () => {
      const testData = { message: "Hello World", number: 42 };
      const response = await request(app)
        .post("/api/v1/echo")
        .send(testData)
        .set("Content-Type", "application/json");

      testUtils.validateSuccessResponse(response);
      expect(response.body.message).toBe("Echo response");
      expect(response.body.data.body).toEqual(testData);
      expect(response.body.data).toHaveProperty("headers");
      expect(response.body.data).toHaveProperty("timestamp");
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/non-existent-route");

      testUtils.validateErrorResponse(response, 404);
      expect(response.body.error.message).toContain("Not Found");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/health");

      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-xss-protection");
      expect(response.headers).toHaveProperty("content-security-policy");
    });
  });

  describe("CORS", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await request(app)
        .options("/api/v1/test")
        .set("Origin", "http://localhost:3000")
        .set("Access-Control-Request-Method", "GET")
        .set("Access-Control-Request-Headers", "Content-Type");

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty("access-control-allow-origin");
      expect(response.headers).toHaveProperty("access-control-allow-methods");
      expect(response.headers).toHaveProperty("access-control-allow-headers");
    });
  });
});
