const request = require("supertest");

const app = require("../app");

describe("Application", () => {
  describe("GET /", () => {
    it("should respond to the root endpoint", async () => {
      const response = await request(app).get("/");

      expect(response.status).toBe(200);

      expect(response.text).toBe("Welcome to Ecommerce Backend API");
    });
  });

  describe("404 handling", () => {
    it("should return an error for an unknown route", async () => {
      const response = await request(app).get("/api/this-route-does-not-exist");

      expect(response.statusCode).toBe(404);
    });
  });
});
