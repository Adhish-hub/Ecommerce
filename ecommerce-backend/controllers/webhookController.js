const crypto = require("crypto");

const Order = require("../models/Order");

const asyncHandler = require("../middlewares/asyncHandler");

const logger = require("../config/logger");

const ApiError = require("../utils/ApiError");

const webhookController = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers["x-razorpay-signature"];

  if (!webhookSignature) {
    throw new ApiError(400, "Razorpay webhook signature is missing.");
  }

  // req.body must be the raw request body
  const rawBody = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (generatedSignature !== webhookSignature) {
    throw new ApiError(400, "Invalid Razorpay webhook signature.");
  }

  // Convert raw body into JSON
  const event = JSON.parse(rawBody.toString());

  logger.info("Razorpay webhook received", { event: event.event });

  // ==========================================
  // HANDLE SUCCESSFUL PAYMENT
  // ==========================================

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;

    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    if (!razorpayOrderId || !razorpayPaymentId) {
      throw new ApiError(
        400,
        "Razorpay order ID or payment ID is missing.",
      );
    }

    const order = await Order.findOne({
      razorpayOrderId,
    });

    if (!order) {
      throw new ApiError(
        404,
        "Order associated with Razorpay payment not found.",
      );
    }

    // Prevent duplicate processing
    if (order.paymentStatus === "paid") {
      return sendWebhookResponse(res);
    }

    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentStatus = "paid";
    order.paidAt = new Date();

    await order.save();

    logger.info("Order marked as paid via webhook", {
      orderId: order._id.toString(),
    });
  }

  // ==========================================
  // HANDLE FAILED PAYMENT
  // ==========================================

  if (event.event === "payment.failed") {
    const payment = event.payload.payment.entity;

    const razorpayOrderId = payment.order_id;

    if (!razorpayOrderId) {
      throw new ApiError(
        400,
        "Razorpay order ID is missing.",
      );
    }

    const order = await Order.findOne({
      razorpayOrderId,
    });

    if (!order) {
      throw new ApiError(
        404,
        "Order associated with failed payment not found.",
      );
    }

    // Do not change an already-paid order to failed
    if (order.paymentStatus === "paid") {
      return sendWebhookResponse(res);
    }

    order.paymentStatus = "failed";

    await order.save();

    logger.warn("Order marked as payment failed via webhook", {
      orderId: order._id.toString(),
    });
  }

  sendWebhookResponse(res);
});

const sendWebhookResponse = (res) => {
  res.status(200).json({
    success: true,
    message: "Webhook received successfully.",
  });
};

module.exports = webhookController;