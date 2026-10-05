const express = require("express");

const {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
} = require("../../controllers/cartController");

const { protect } = require("../../middlewares/authMiddleware");

const { quantityValidator } = require("../../validators/cartValidator");

const validate = require("../../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get the current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get("/", protect, getCart);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   post:
 *     summary: Add a product to the cart
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product added to cart successfully
 *       400:
 *         description: Invalid product ID or quantity
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found
 */
router.post("/:productId", protect, quantityValidator, validate, addToCart);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   put:
 *     summary: Update product quantity in the cart
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart quantity updated successfully
 *       400:
 *         description: Invalid product ID or quantity
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found in cart
 */
router.put(
  "/:productId",
  protect,
  quantityValidator,
  validate,
  updateCartQuantity,
);

/**
 * @swagger
 * /api/v1/cart/{productId}:
 *   delete:
 *     summary: Remove a product from the cart
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product
 *     responses:
 *       200:
 *         description: Product removed from cart successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found in cart
 */
router.delete("/:productId", protect, removeFromCart);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear the current user's cart
 *     tags:
 *       - Cart
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       401:
 *         description: Authentication required
 */
router.delete("/", protect, clearCart);

module.exports = router;
