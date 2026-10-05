const request = require("supertest");

const app = require("../../app");

const { createTestUser } = require("../utils/testHelpers");

describe("POST /api/v1/auth/refresh", () => {
  it("should refresh the access token using a valid refresh token", async () => {
    const email = `refresh${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(loginResponse.statusCode).toBe(200);

    const refreshCookie = loginResponse.headers["set-cookie"].find((cookie) =>
      cookie.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.headers["set-cookie"]).toBeDefined();

    expect(
      response.headers["set-cookie"].some((cookie) =>
        cookie.startsWith("accessToken="),
      ),
    ).toBe(true);
  });

  it("should reject a refresh request without a refresh token", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid refresh token", async () => {
    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", "refreshToken=invalid-refresh-token");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });
});
