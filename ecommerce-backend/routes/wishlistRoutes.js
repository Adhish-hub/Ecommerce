const express = require("express");

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get the current user's wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
    "/", 
    protect, 
    getWishlist
);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   post:
 *     summary: Add a product to the wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to add to the wishlist
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product added to wishlist successfully
 *       400:
 *         description: Product is already in the wishlist
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found
 */
router.post(
    "/:productId", 
    protect, 
    addToWishlist
);

/**
 * @swagger
 * /api/wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from the wishlist
 *     tags:
 *       - Wishlist
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to remove from the wishlist
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product removed from wishlist successfully
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found or not present in wishlist
 */
router.delete(
    "/:productId", 
    protect, 
    removeFromWishlist
);

module.exports = router;
