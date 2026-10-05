const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  getAllOrders,
  getOrderStats,
} = require("../controllers/orderController");

const { protect } = require("../middlewares/authMiddleware");

const { authorize } = require("../middlewares/roleMiddleware");

const { createOrderValidator } = require("../validators/orderValidator");

const idempotencyMiddleware = require("../middlewares/idempotencyMiddleware");

const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates an order using the authenticated user's cart. Stock is deducted during the order transaction.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique key used to safely retry the request without creating a duplicate order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - address
 *                   - city
 *                   - postalCode
 *                   - country
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: 123 Main Street
 *                   city:
 *                     type: string
 *                     example: Mumbai
 *                   postalCode:
 *                     type: string
 *                     example: 400001
 *                   country:
 *                     type: string
 *                     example: India
 *               paymentMethod:
 *                 type: string
 *                 enum:
 *                   - COD
 *                   - Razorpay
 *                 default: COD
 *                 example: COD
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error, empty cart, missing product, or insufficient stock
 *       401:
 *         description: Authentication required
 *       404:
 *         description: User not found
 */
router.post(
  "/",
  protect,
  createOrderValidator,
  validate,
  idempotencyMiddleware,
  createOrder,
);

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get my orders
 *     description: Retrieves all orders belonging to the authenticated user.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/myorders", protect, getMyOrders);



/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     description: Retrieves an order belonging to the authenticated user. Administrators can view any order.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB order ID
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       400:
 *         description: Invalid order ID
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not authorized to view this order
 *       404:
 *         description: Order not found
 */
router.get("/:id", protect, getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     description: Allows an administrator to update the status of an order. Delivered and cancelled orders cannot be updated.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB order ID
 *         example: 65a123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum:
 *                   - placed
 *                   - processing
 *                   - shipped
 *                   - delivered
 *                   - cancelled
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Invalid order status or order cannot be updated
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Order not found
 */
router.put("/:id/status", protect, authorize("admin"), updateOrderStatus);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders
 *     description: Retrieves all orders with pagination and optional status filters.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum:
 *             - placed
 *             - processing
 *             - shipped
 *             - delivered
 *             - cancelled
 *         description: Filter orders by order status
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum:
 *             - pending
 *             - paid
 *             - failed
 *         description: Filter orders by payment status
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         description: Invalid order status or payment status
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get("/admin/all", protect, authorize("admin"), getAllOrders);

/**
 * @swagger
 * /api/orders/admin/stats:
 *   get:
 *     summary: Get order statistics
 *     description: Retrieves order counts and total revenue for the administrator.
 *     tags:
 *       - Orders
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get("/admin/stats", protect, authorize("admin"), getOrderStats);

module.exports = router;
