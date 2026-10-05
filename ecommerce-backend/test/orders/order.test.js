const request = require("supertest");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const { createTestUser } = require("../utils/testHelpers");

describe("Order API", () => {
  let user;
  let admin;
  let userCookies;
  let adminCookies;
  let product;

  beforeEach(async () => {
    const userData = await createTestUser({
      email: `orderuser${Date.now()}@example.com`,
      password: "password123",
      role: "customer",
    });

    user = userData.user;

    const adminData = await createTestUser({
      email: `orderadmin${Date.now()}@example.com`,
      password: "password123",
      role: "admin",
    });

    admin = adminData.user;

    const userLogin = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "password123",
    });

    userCookies = userLogin.headers["set-cookie"];

    const adminLogin = await request(app).post("/api/v1/auth/login").send({
      email: admin.email,
      password: "password123",
    });

    adminCookies = adminLogin.headers["set-cookie"];

    const category = await Category.create({
      name: `Order Category${Date.now()}`,
    });

    product = await Product.create({
      name: "Order Product",
      description: "Product for order testing",
      price: 1000,
      category: category._id,
      stock: 20,
      lowStockThreshold: 5,
    });

    await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", userCookies)
      .send({
        quantity: 2,
      });
  });

  it("should create an order from the user's cart", async () => {
    const response = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `order-${Date.now()}`)
      .send({
        shippingAddress: {
          address: "123 Main Street",
          city: "Mumbai",
          postalCode: "400001",
          country: "India",
        },
        paymentMethod: "COD",
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toBeDefined();
  });

  it("should require an idempotency key", async () => {
    const response = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", userCookies)
      .send({
        shippingAddress: {
          address: "123 Main Street",
          city: "Mumbai",
          postalCode: "400001",
          country: "India",
        },
        paymentMethod: "COD",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject an unauthenticated order request", async () => {
    const response = await request(app)
      .post("/api/v1/orders")
      .set("Idempotency-Key", `unauth-${Date.now()}`)
      .send({
        shippingAddress: {
          address: "123 Main Street",
          city: "Mumbai",
          postalCode: "400001",
          country: "India",
        },
        paymentMethod: "COD",
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should get the current user's orders", async () => {
    const response = await request(app)
      .get("/api/v1/orders/myorders")
      .set("Cookie", userCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should reject access to all orders for a non-admin user", async () => {
    const response = await request(app)
      .get("/api/v1/orders/admin/all")
      .set("Cookie", userCookies);

    expect(response.statusCode).toBe(403);

    expect(response.body.success).toBe(false);
  });

  it("should allow an admin to get all orders", async () => {
    const response = await request(app)
      .get("/api/v1/orders/admin/all")
      .set("Cookie", adminCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });

  it("should allow an admin to get order statistics", async () => {
    const response = await request(app)
      .get("/api/v1/orders/admin/stats")
      .set("Cookie", adminCookies);

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);
  });
});
