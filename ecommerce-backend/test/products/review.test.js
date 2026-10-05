const request = require("supertest");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const { createTestUser } = require("../utils/testHelpers");

describe("Product Review API", () => {
  let user;
  let loginCookies;
  let product;

  beforeEach(async () => {
    const userData = await createTestUser({
      email: `review${Date.now()}@example.com`,
      password: "password123",
    });

    user = userData.user;

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "password123",
    });

    loginCookies = loginResponse.headers["set-cookie"];

    const category = await Category.create({
      name: `Review Category${Date.now()}`,
    });

    product = await Product.create({
      name: "Review Product",
      description: "Product for review testing",
      price: 1200,
      category: category._id,
      stock: 10,
      lowStockThreshold: 2,
    });
  });

  it("should get product reviews", async () => {
    const response = await request(app).get(
      `/api/v1/products/${product._id}/reviews`,
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should add a product review", async () => {
    const response = await request(app)
      .post(`/api/v1/products/${product._id}/review`)
      .set("Cookie", loginCookies)
      .send({
        rating: 5,
        comment: "Excellent product.",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);
  });

  it("should reject an invalid rating", async () => {
    const response = await request(app)
      .post(`/api/v1/products/${product._id}/review`)
      .set("Cookie", loginCookies)
      .send({
        rating: 10,
        comment: "Excellent product.",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject an empty comment", async () => {
    const response = await request(app)
      .post(`/api/v1/products/${product._id}/review`)
      .set("Cookie", loginCookies)
      .send({
        rating: 5,
        comment: "",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should require authentication to add a review", async () => {
    const response = await request(app)
      .post(`/api/v1/products/${product._id}/review`)
      .send({
        rating: 5,
        comment: "Excellent product.",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });
});
