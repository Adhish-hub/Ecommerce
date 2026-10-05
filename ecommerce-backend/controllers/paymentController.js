const crypto = require("crypto");

const razorpay = require("../config/razorpay");

const { completeIdempotency, failIdempotency } = require("../utils/idempotencyResponse");

const Order = require("../models/Order");

const User = require("../models/User");

const ApiError = require("../utils/ApiError");

const asyncHandler = require("../middlewares/asyncHandler");

const createRazorpayOrder = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Make sure the order belongs to the logged-in user
    if (order.user.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not allowed to pay for this order");
    }

    // Prevent paying for an already-paid order
    if (order.paymentStatus === "paid") {
      throw new ApiError(400, "Order is already paid");
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalPrice * 100),
      currency: "INR",
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    order.razorpayOrderId = razorpayOrder.id;

    await order.save();

    // Create the response body first
    const responseBody = {
      success: true,
      message: "Razorpay order created successfully",
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        orderId: order._id,
      },
    };

    // Save successful response in Idempotency collection
    await completeIdempotency(req, 201, responseBody);

    // Send response
    res.status(201).json(responseBody);
  } catch (error) {
    // Mark idempotency request as failed
    await failIdempotency(req);

    throw error;
  }
});



const verifyRazorpayPayment = asyncHandler(async(req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if(
        !razorpay_payment_id ||
        !razorpay_order_id ||
        !razorpay_signature
    ){
        throw new ApiError(
            400,
            "Payment verification data is incomplete",
        );
    }

    const order = await Order.findOne({
        razorpayOrderId: razorpay_order_id,
    });

    if(!order){
        throw new ApiError(
            404,
            "Order not found",
        );
    }

    //the code below makes sure that the logged-in user own this order.
    if(
        order.user.toString() !==
        req.user._id.toString()
    ){
        throw new ApiError(
            403,
            "You are not allowed to verify this payment,"
        );
    }

    //the code below prevents duplicate payment processing
    if(order.paymentStatus === "paid"){
        return res.status(200).json({
            success: true,
            message: "Payment already verified",
            data: order,
        });
    }

    const generatedSignature = 
    crypto
    .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
    )
    .update(
        `${order.razorpayOrderId}|${razorpay_payment_id}`
    )
    .digest("hex");

    if(generatedSignature !== razorpay_signature){
        throw new ApiError(
            400,
            "Invalid payment signature"
        );
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    order.paymentStatus = "paid";
    order.paidAt = new Date();

    await order.save();

    const user = await User.findById(req.user._id);

    if(user){
        user.cart = [];
        await user.save();
    }

    res.status(200).json({
        success: true,
        message: "Payment verified successfully.",
        data: order,
    });
});


module.exports = { createRazorpayOrder, verifyRazorpayPayment };