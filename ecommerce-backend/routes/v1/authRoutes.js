const express = require("express");

const {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPasswordController,
  verifyPasswordResetOtpController,
  resetPasswordController,
  getMySessions,
  revokeSession,
  revokeOtherSessions,
  getMe
} = require("../../controllers/authController");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
} = require("../../validators/authValidator");

const validate = require("../../middlewares/validate");

const { protect } = require("../../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new customer
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Adish Tiwari
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adish@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 */

router.post("/register", registerValidation, validate, register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adish@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 */

router.post("/login", loginValidation, validate, login);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adish@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP request processed
 *       400:
 *         description: Validation error
 */

router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  forgotPasswordController,
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh the access token
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       401:
 *         description: Refresh token missing, invalid, or expired
 */

router.post("/refresh", refreshAccessToken);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout the current session
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Logout successful
 */

router.post(
  "/logout",
  // protect,
  logout,
);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: Get all active sessions
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sessions retrieved successfully
 *       401:
 *         description: Authentication required
 */

router.get("/sessions", protect, getMySessions);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   delete:
 *     summary: Revoke all other sessions
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All other sessions revoked successfully
 *       401:
 *         description: Authentication required
 */

router.delete("/sessions", protect, revokeOtherSessions);

/**
 * @swagger
 * /api/v1/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Revoke a specific session
 *     tags:
 *       - Sessions
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the session to revoke
 *     responses:
 *       200:
 *         description: Session revoked successfully
 *       400:
 *         description: Cannot revoke the current session
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Session not found
 */

router.delete("/sessions/:sessionId", protect, revokeSession);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: adish@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       429:
 *         description: Too many OTP attempts
 */

router.post(
  "/verify-otp",
  verifyOtpValidation,
  validate,
  verifyPasswordResetOtpController,
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 example: 8f4a7c...
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token
 */

router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  resetPasswordController,
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags:
 *       - Authentication
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/me", protect, getMe);


module.exports = router;
