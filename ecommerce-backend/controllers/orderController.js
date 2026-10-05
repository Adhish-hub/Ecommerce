const mongoose = require("mongoose");

const Order = require("../models/Order");

const notificationQueue = require("../queues/notificationQueue");

const User = require("../models/User");

const Product = require("../models/Product");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const { completeIdempotency, failIdempotency } = require("../utils/idempotencyResponse");

const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  const selectedPaymentMethod = paymentMethod || "COD";

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findById(req.user._id)
      .populate("cart.product")
      .session(session);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.cart || user.cart.length === 0) {
      throw new ApiError(400, "Your cart is empty");
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.postalCode ||
      !shippingAddress.country
    ) {
      throw new ApiError(400, "Complete shipping address is required.");
    }

    // Check whether all cart products still exist
    for (const item of user.cart) {
      if (!item.product) {
        throw new ApiError(400, "A product in your cart no longer exists.");
      }
    }

    // Create order items
    const orderItems = user.cart.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }));

    // Calculate item price
    const itemsPrice = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate shipping
    const shippingPrice = itemsPrice >= 1000 ? 0 : 100;

    const totalPrice = itemsPrice + shippingPrice;

    // Create order inside transaction
    const order = await Order.create(
      [
        {
          user: req.user._id,
          orderItems,
          shippingAddress,
          paymentMethod: selectedPaymentMethod,
          itemsPrice,
          shippingPrice,
          totalPrice,
          paymentStatus: "pending",
          orderStatus: "placed",
        },
      ],
      { session },
    );

    // Atomically deduct stock
    for (const item of user.cart) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
        },
        {
          $inc: {
            stock: -item.quantity,
          },
        },
        {
          new: true,
          session,
        },
      );

      if (!updatedProduct) {
        throw new ApiError(
          400,
          `Not enough stock available for ${item.product.name}.`,
        );
      }
    }

    // Clear cart inside the transaction
    if (selectedPaymentMethod === "COD") {
      user.cart = [];
      await user.save({ session });
    }

    await session.commitTransaction();

    await Promise.all(orderItems.map((i) => clearProductCache(i.product)));

    await notificationQueue.add("order-confirmation", {
      type: "order-confirmation",
      orderId: order[0]._id.toString(),
      userEmail: user.email,
      totalPrice: order[0].totalPrice,
    });

    const responseBody = {
      success: true,
      message: "Order created successfully",
      data: order[0],
    };

    await completeIdempotency(req, 201, responseBody);

    res.status(201).json(responseBody);
  } catch (error) {
    // Something failed → undo everything
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    await failIdempotency(req);

    throw error;
  } finally {
    // Always close the session
    await session.endSession();
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    user: req.user._id,
  })

    .populate("user", "name email")
    .populate("orderItems.product", "name image")
    .sort("-createdAt");

  sendResponse(res, 200, "Orders retrieved successfully", {
    count: orders.length,
    data: orders,
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems.product", "name image");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  //the code below ensures that the customer can see his own order
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    throw new ApiError(403, "Yor are not allowed to view this order.");
  }

  sendResponse(res, 200, "Order retrieved successfully", order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const allowedStatuses = [
    "placed",
    // "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!orderStatus) {
    throw new ApiError(400, "Order status is required.");
  }

  if (!allowedStatuses.includes(orderStatus)) {
    throw new ApiError(400, "Invalid order status");
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      throw new ApiError(404, "Order not found.");
    }

    // Prevent changing a delivered order
    if (order.orderStatus === "delivered") {
      throw new ApiError(400, "Delivered orders can not be updated.");
    }

    // Prevent changing a cancelled order
    if (order.orderStatus === "cancelled") {
      throw new ApiError(400, "Cancelled orders can not be updated.");
    }

    // Restore stock when the order is cancelled
    if (orderStatus === "cancelled") {
      for (const item of order.orderItems) {
        const updatedProduct = await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: {
              stock: item.quantity,
            },
          },
          {
            new: true,
            session,
          },
        );

        if (!updatedProduct) {
          throw new ApiError(
            404,
            "A product from this order no longer exists.",
          );
        }
      }
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save({ session });

    await session.commitTransaction();
    await Promise.all(orderItems.map((i) => clearProductCache(i.product)));

    sendResponse(res, 200, "Order status updated successfully.", order);
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { status, paymentStatus } = req.query;

  const allowedOrderStatuses = [
    "placed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const allowedPaymentStatuses = ["pending", "paid", "failed"];

  if (status && !allowedOrderStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status,");
  }

  if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
    throw new ApiError(400, "Invalid payment status.");
  }

  let searchQuery = {};

  if (status) {
    searchQuery.orderStatus = status;
  }

  if (paymentStatus) {
    searchQuery.paymentStatus = paymentStatus;
  }

  const totalOrders = await Order.countDocuments(searchQuery);

  const orders = await Order.find(searchQuery)
    .populate("user", "name email")
    .populate("orderItems.product", "name image")
    .sort("-createdAt")
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalOrders / limit);

  sendResponse(res, 200, "Orders retrieved successfully", {
    page,
    limit,
    totalOrders,
    totalPages,
    count: orders.length,
    data: orders,
  });
});

// Now the admin can use:

// GET /api/orders/admin/all

// or:

// GET /api/orders/admin/all?page=2&limit=10

// or filter by order status:

// GET /api/orders/admin/all?status=shipped

// or payment status:

// GET /api/orders/admin/all?paymentStatus=paid

// You can also combine them:

// GET /api/orders/admin/all?page=1&limit=10&status=delivered&paymentStatus=paid

const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();

  const pendingOrders = await Order.countDocuments({
    orderStatus: "placed",
  });

  const processingOrders = await Order.countDocuments({
    orderStatus: "processing",
  });

  const shippedOrders = await Order.countDocuments({
    orderStatus: "shipped",
  });

  const deliveredOrders = await Order.countDocuments({
    orderStatus: "delivered",
  });

  const cancelledOrders = await Order.countDocuments({
    orderStatus: "cancelled",
  });

  const pendingPayments = await Order.countDocuments({
    paymentStatus: "pending",
  });

  const paidOrders = await Order.countDocuments({
    paymentStatus: "paid",
  });

  const revenueResult = await Order.aggregate([
    {
      $match: {
        paymentStatus: "paid",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalPrice",
        },
      },
    },
  ]);

  const totalRevenue =
    revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

  sendResponse(res, 200, "Order statistics retrieved successfully", {
    totalOrders,
    pendingOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    pendingPayments,
    paidOrders,
    totalRevenue,
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderStats,
};
