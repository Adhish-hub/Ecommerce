const request = require("supertest");

const app = require("../../app");

const { createTestUser } = require("../utils/testHelpers");

describe("POST /api/v1/auth/login", () => {
  it("should login successfully with valid credentials", async () => {
    const email = `login${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("email", email);

    expect(response.body.data).not.toHaveProperty("password");

    expect(response.headers["set-cookie"]).toBeDefined();

    expect(
      response.headers["set-cookie"].some((cookie) =>
        cookie.startsWith("accessToken="),
      ),
    ).toBe(true);

    expect(
      response.headers["set-cookie"].some((cookie) =>
        cookie.startsWith("refreshToken="),
      ),
    ).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const email = `wrongpass${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject a non-existing user", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: `notfound${Date.now()}@example.com`,
        password: "password123",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid login data", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({
      email: "invalid-email",
      password: "",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });
});
