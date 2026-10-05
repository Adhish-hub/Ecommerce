const request = require("supertest");

const app = require("../../app");

describe("POST /api/v1/auth/register", () => {
  it("should register a new user successfully", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "password123",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.message).toBe("User created successfully.");

    expect(response.body.data).toHaveProperty("_id");

    expect(response.body.data).toHaveProperty("name", "Test User");

    expect(response.body.data).toHaveProperty(
      "email",
      expect.stringContaining("@example.com"),
    );

    expect(response.body.data).not.toHaveProperty("password");
  });

  it("should reject registration when required fields are missing", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject an invalid email", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email: "invalid-email",
      password: "password123",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject a short password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "123",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject an already registered email", async () => {
    const email = `duplicate${Date.now()}@example.com`;

    await request(app).post("/api/v1/auth/register").send({
      name: "Test User",
      email,
      password: "password123",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      name: "Another User",
      email,
      password: "password123",
    });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });
});
