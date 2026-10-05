const request = require("supertest");

const app = require("../../app");

const Session = require("../../models/Session");

const { createTestUser } = require("../utils/testHelpers");

describe("Session Management", () => {
  it("should get the current user's sessions", async () => {
    const email = `sessions${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    const cookies = loginResponse.headers["set-cookie"];

    const response = await request(app)
      .get("/api/v1/auth/sessions")
      .set("Cookie", cookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should reject session access without authentication", async () => {
    const response = await request(app).get("/api/v1/auth/sessions");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should revoke other sessions", async () => {
    const email = `othersessions${Date.now()}@example.com`;

    const userData = await createTestUser({
      email,
      password: "password123",
    });

    const firstLogin = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    const secondLogin = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(firstLogin.statusCode).toBe(200);
    expect(secondLogin.statusCode).toBe(200);

    const response = await request(app)
      .delete("/api/v1/auth/sessions")
      .set("Cookie", firstLogin.headers["set-cookie"]);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    const sessions = await Session.find({
      user: userData.user._id,
    });

    expect(sessions.length).toBeLessThanOrEqual(1);
  });
});
