const bcrypt = require("bcrypt");

const User = require("../../models/User");

const request = require("supertest");

const app = require("../../app");

const createTestUser = async ({
  name = "Test User",
  email = `test${Date.now()}@example.com`,
  password = "password123",
  role = "customer",
} = {}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  return {
    user,
    password,
  };
};

const loginTestUser = async (email, password) => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email,
    password,
  });

  expect(response.statusCode).toBe(200);

  return response;
};

const getCookies = (response) => {
  return response.headers["set-cookie"] || [];
};

const getCookie = (response, cookieName) => {
  const cookies = getCookies(response);

  return cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
};

const getAccessTokenCookie = (response) => {
  return getCookie(response, "accessToken");
};

const getRefreshTokenCookie = (response) => {
  return getCookie(response, "refreshToken");
};

module.exports = {
  createTestUser,
  loginTestUser,
  getCookies,
  getCookie,
  getAccessTokenCookie,
  getRefreshTokenCookie,
};
