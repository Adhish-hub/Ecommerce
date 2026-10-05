const request = require("supertest");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const { createTestUser } = require("../utils/testHelpers");

describe("Product API", () => {
  let adminCookies;
  let sellerCookies;
  let category;
  let product;

  beforeEach(async () => {
    category = await Category.create({
      name: `Products Category${Date.now()}`,
    });

    const admin = await createTestUser({
      email: `admin${Date.now()}@example.com`,
      password: "password123",
      role: "admin",
    });

    const seller = await createTestUser({
      email: `seller${Date.now()}@example.com`,
      password: "password123",
      role: "seller",
    });

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: admin.user.email,
      password: "password123",
    });

    adminCookies = adminLogin.headers["set-cookie"];

    const sellerLogin = await request(app).post("/api/v1/auth/login").send({
      email: seller.user.email,
      password: "password123",
    });

    sellerCookies = sellerLogin.headers["set-cookie"];

    product = await Product.create({
      name: "Existing Product",
      description: "Existing product description",
      price: 1500,
      category: category._id,
      stock: 20,
      lowStockThreshold: 5,
    });
  });

  it("should get all products", async () => {
    const response = await request(app).get("/api/v1/products");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body).toHaveProperty("data");
  });

  it("should get a product by ID", async () => {
    const response = await request(app).get(`/api/v1/products/${product._id}`);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("_id", product._id.toString());
  });

  it("should return 404 for a missing product", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    const response = await request(app).get(`/api/v1/products/${fakeId}`);

    expect(response.statusCode).toBe(404);

    expect(response.body.success).toBe(false);
  });

  it("should allow an admin to get low-stock products", async () => {
    await Product.create({
      name: "Low Stock Product",
      description: "Low stock test",
      price: 500,
      category: category._id,
      stock: 2,
      lowStockThreshold: 5,
    });

    const response = await request(app)
      .get("/api/v1/products/low-stock")
      .set("Cookie", adminCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should reject low-stock access without authentication", async () => {
    const response = await request(app).get("/api/v1/products/low-stock");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject low-stock access for a non-admin user", async () => {
    const response = await request(app)
      .get("/api/v1/products/low-stock")
      .set("Cookie", sellerCookies);

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);
  });

  it("should allow a seller to create a product", async () => {
    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", sellerCookies)
      .field("name", "New Product")
      .field("description", "New product description")
      .field("price", "2500")
      .field("category", category._id.toString())
      .field("stock", "30")
      .field("lowStockThreshold", "5");

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("name", "New Product");
  });

  it("should reject product creation for an unauthenticated user", async () => {
    const response = await request(app)
      .post("/api/v1/products")
      .field("name", "Unauthorized Product")
      .field("description", "Test")
      .field("price", "100")
      .field("category", category._id.toString())
      .field("stock", "10")
      .field("lowStockThreshold", "2");

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should allow a seller to update a product", async () => {
    const response = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set("Cookie", sellerCookies)
      .field("name", "Updated Product")
      .field("description", "Updated description")
      .field("price", "2000")
      .field("category", category._id.toString())
      .field("stock", "25")
      .field("lowStockThreshold", "5");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should allow an admin to delete a product", async () => {
    const response = await request(app)
      .delete(`/api/v1/products/${product._id}`)
      .set("Cookie", adminCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });
});
