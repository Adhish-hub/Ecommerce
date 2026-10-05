const request = require("supertest");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const { createTestUser } = require("../utils/testHelpers");

describe("Cart API", () => {
  let user;
  let loginCookies;
  let product;

  beforeEach(async () => {
    const userData = await createTestUser({
      email: `cart${Date.now()}@example.com`,
      password: "password123",
    });

    user = userData.user;

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "password123",
    });

    loginCookies = loginResponse.headers["set-cookie"];

    const category = await Category.create({
      name: `Electronics${Date.now()}`,
    });

    product = await Product.create({
      name: "Test Headphones",
      description: "Test product",
      price: 1999,
      category: category._id,
      stock: 20,
      lowStockThreshold: 5,
    });
  });

  it("should get the current user's cart", async () => {
    const response = await request(app)
      .get("/api/v1/cart")
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should require authentication", async () => {
    const response = await request(app).get("/api/v1/cart");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should add a product to the cart", async () => {
    const response = await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 2,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should reject an invalid quantity", async () => {
    const response = await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 0,
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject a non-existing product", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    const response = await request(app)
      .post(`/api/v1/cart/${fakeId}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 1,
      });

    expect([400, 404]).toContain(response.statusCode);

    expect(response.body.success).toBe(false);
  });

  it("should update cart quantity", async () => {
    await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .put(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 5,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should remove a product from the cart", async () => {
    await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .delete(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should clear the cart", async () => {
    await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", loginCookies)
      .send({
        quantity: 2,
      });

    const response = await request(app)
      .delete("/api/v1/cart")
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });
});
