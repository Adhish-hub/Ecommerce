const request = require("supertest");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const { createTestUser } = require("../utils/testHelpers");

describe("Wishlist API", () => {
  let loginCookies;
  let product;

  beforeEach(async () => {
    const userData = await createTestUser({
      email: `wishlist${Date.now()}@example.com`,
      password: "password123",
    });

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: userData.user.email,
      password: "password123",
    });

    loginCookies = loginResponse.headers["set-cookie"];

    const category = await Category.create({
      name: `Wishlist Category${Date.now()}`,
    });

    product = await Product.create({
      name: "Wishlist Product",
      description: "Wishlist test product",
      price: 999,
      category: category._id,
      stock: 10,
      lowStockThreshold: 2,
    });
  });

  it("should get the wishlist", async () => {
    const response = await request(app)
      .get("/api/v1/wishlist")
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should add a product to the wishlist", async () => {
    const response = await request(app)
      .post(`/api/v1/wishlist/${product._id}`)
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should remove a product from the wishlist", async () => {
    await request(app)
      .post(`/api/v1/wishlist/${product._id}`)
      .set("Cookie", loginCookies);

    const response = await request(app)
      .delete(`/api/v1/wishlist/${product._id}`)
      .set("Cookie", loginCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should require authentication", async () => {
    const response = await request(app).get("/api/v1/wishlist");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });
});
