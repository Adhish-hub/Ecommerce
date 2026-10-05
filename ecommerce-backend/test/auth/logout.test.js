const request = require("supertest");

const app = require("../../app");

const { createTestUser } = require("../utils/testHelpers");

describe("POST /api/v1/auth/logout", () => {
  it("should logout successfully", async () => {
    const email = `logout${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    expect(loginResponse.statusCode).toBe(200);

    const cookies = loginResponse.headers["set-cookie"];

    const response = await request(app)
      .post("/api/v1/auth/logout")
      .set("Cookie", cookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should invalidate the refresh token after logout", async () => {
    const email = `logoutrefresh${Date.now()}@example.com`;

    await createTestUser({
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email,
      password: "password123",
    });

    const cookies = loginResponse.headers["set-cookie"];

    const refreshCookie = cookies.find((cookie) =>
      cookie.startsWith("refreshToken="),
    );

    await request(app).post("/api/v1/auth/logout").set("Cookie", cookies);

    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", refreshCookie);

    expect(refreshResponse.statusCode).toBe(401);

    expect(refreshResponse.body.success).toBe(false);
  });
});
