const express = require("express");

const {
  addProductReview,
  getProductReviews,
  updateProductReview,
  deleteProductReview,
} = require("../controllers/reviewController");

const { protect } = require("../middlewares/authMiddleware");

const { reviewValidator } = require("../validators/reviewValidator");

const validate = require("../middlewares/validate");

const router = express.Router();

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a product
 *     tags:
 *       - Reviews
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product reviews retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get("/:id/reviews", getProductReviews);

/**
 * @swagger
 * /api/products/{id}/review:
 *   post:
 *     summary: Add a review to a product
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 65a123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: Excellent product. Really good quality.
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         description: Validation error or user has already reviewed the product
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Product not found
 */
router.post(
  "/:id/review",
  protect,
  reviewValidator,
  validate,
  addProductReview,
);

/**
 * @swagger
 * /api/products/{id}/review/{reviewId}:
 *   put:
 *     summary: Update a product review
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 65a123456789abcdef123456
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *         example: 65b123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *               - comment
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Good product, but delivery could be faster.
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not allowed to update this review
 *       404:
 *         description: Product or review not found
 */
router.put(
  "/:id/review/:reviewId",
  protect,
  reviewValidator,
  validate,
  updateProductReview,
);

/**
 * @swagger
 * /api/products/{id}/review/{reviewId}:
 *   delete:
 *     summary: Delete a product review
 *     tags:
 *       - Reviews
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: 65a123456789abcdef123456
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *         example: 65b123456789abcdef123456
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: User is not allowed to delete this review
 *       404:
 *         description: Product or review not found
 */
router.delete("/:id/review/:reviewId", protect, deleteProductReview);

module.exports = router;
