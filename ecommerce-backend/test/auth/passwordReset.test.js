const request = require("supertest");

const app = require("../../app");

const User = require("../../models/User");

const { createTestUser } = require("../utils/testHelpers");

describe("Password Reset", () => {
  describe("POST /api/v1/auth/forgot-password", () => {
    it("should process a password reset request for an existing user", async () => {
      const email = `forgot${Date.now()}@example.com`;

      await createTestUser({
        email,
        password: "password123",
      });

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email,
        });

      expect([200, 201]).toContain(response.statusCode);

      expect(response.body.success).toBe(true);

      const user = await User.findOne({ email });

      expect(user.resetPasswordOtpHash).toBeDefined();

      expect(user.resetPasswordOtpExpiresAt).toBeDefined();

      expect(user.resetPasswordOtpAttempts).toBe(0);
    });

    it("should reject invalid email input", async () => {
      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({
          email: "invalid-email",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/verify-otp", () => {
    it("should reject an invalid OTP", async () => {
      const email = `otp${Date.now()}@example.com`;

      await createTestUser({
        email,
        password: "password123",
      });

      await request(app).post("/api/v1/auth/forgot-password").send({
        email,
      });

      const response = await request(app).post("/api/v1/auth/verify-otp").send({
        email,
        otp: "000000",
      });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject an incorrectly formatted OTP", async () => {
      const email = `otpformat${Date.now()}@example.com`;

      const response = await request(app).post("/api/v1/auth/verify-otp").send({
        email,
        otp: "123",
      });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/reset-password", () => {
    it("should reject an invalid reset token", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          resetToken: "invalid-reset-token",
          newPassword: "newPassword123",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject a short new password", async () => {
      const response = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({
          resetToken: "some-token",
          newPassword: "123",
        });

      expect(response.statusCode).toBe(400);

      expect(response.body.success).toBe(false);
    });
  });
});
