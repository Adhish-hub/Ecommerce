const request = require("supertest");

const crypto = require("crypto");

const app = require("../../app");

const Product = require("../../models/Product");

const Category = require("../../models/Category");

const razorpay = require("../../config/razorpay");

const { createTestUser } = require("../utils/testHelpers");

describe("Razorpay Payment API", () => {
  let user;
  let userCookies;
  let product;
  let orderId;

  beforeEach(async () => {
    const userData = await createTestUser({
      email: `payment${Date.now()}@example.com`,
      password: "password123",
    });

    user = userData.user;

    const loginResponse = await request(app).post("/api/v1/auth/login").send({
      email: user.email,
      password: "password123",
    });

    userCookies = loginResponse.headers["set-cookie"];

    const category = await Category.create({
      name: `Payment Category${Date.now()}`,
    });

    product = await Product.create({
      name: "Payment Product",
      description: "Payment test product",
      price: 2000,
      category: category._id,
      stock: 10,
      lowStockThreshold: 2,
    });

    await request(app)
      .post(`/api/v1/cart/${product._id}`)
      .set("Cookie", userCookies)
      .send({
        quantity: 1,
      });

    const orderResponse = await request(app)
      .post("/api/v1/orders")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `payment-order-${Date.now()}`)
      .send({
        shippingAddress: {
          address: "123 Main Street",
          city: "Mumbai",
          postalCode: "400001",
          country: "India",
        },
        paymentMethod: "Razorpay",
      });

    expect(orderResponse.statusCode).toBe(201);

    orderId = orderResponse.body.data._id;
  });

  it("should create a Razorpay order", async () => {
    razorpay.orders.create.mockResolvedValueOnce({
      id: "order_test_123",
      amount: 200000,
      currency: "INR",
    });

    const response = await request(app)
      .post("/api/v1/payments/razorpay/create")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `razorpay-${Date.now()}`)
      .send({
        orderId,
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(razorpay.orders.create).toHaveBeenCalled();
  });

  it("should reject payment creation without authentication", async () => {
    const response = await request(app)
      .post("/api/v1/payments/razorpay/create")
      .set("Idempotency-Key", `payment-noauth-${Date.now()}`)
      .send({
        orderId,
      });

    expect(response.statusCode).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject payment creation without an order ID", async () => {
    const response = await request(app)
      .post("/api/v1/payments/razorpay/create")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `payment-noorder-${Date.now()}`)
      .send({});

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should verify a valid Razorpay payment signature", async () => {
    razorpay.orders.create.mockResolvedValueOnce({
      id: "order_test_456",
      amount: 200000,
      currency: "INR",
    });

    const createResponse = await request(app)
      .post("/api/v1/payments/razorpay/create")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `verify-create-${Date.now()}`)
      .send({
        orderId,
      });

    expect(createResponse.statusCode).toBe(201);

    const razorpayOrderId =
      createResponse.body.data.razorpayOrderId || "order_test_456";

    const paymentId = "pay_test_123";

    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest("hex");

    const response = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", userCookies)
      .send({
        razorpay_payment_id: paymentId,
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: signature,
      });

    expect([200, 201]).toContain(response.statusCode);

    expect(response.body.success).toBe(true);
  });

  it("should reject an invalid Razorpay signature", async () => {
    razorpay.orders.create.mockResolvedValueOnce({
      id: "order_test_invalid_sig",
      amount: 200000,
      currency: "INR",
    });

    const createResponse = await request(app)
      .post("/api/v1/payments/razorpay/create")
      .set("Cookie", userCookies)
      .set("Idempotency-Key", `invalid-sig-${Date.now()}`)
      .send({ orderId });

    expect(createResponse.statusCode).toBe(201);

    const razorpayOrderId =
      createResponse.body.data.razorpayOrderId || "order_test_invalid_sig";

    const response = await request(app)
      .post("/api/v1/payments/razorpay/verify")
      .set("Cookie", userCookies)
      .send({
        razorpay_payment_id: "pay_test_123",
        razorpay_order_id: razorpayOrderId,
        razorpay_signature: "invalid-signature",
      });

    expect(response.statusCode).toBe(400);

    expect(response.body.success).toBe(false);
  });
});
