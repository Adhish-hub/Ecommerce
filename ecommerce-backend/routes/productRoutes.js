const express = require("express");

const {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
} = require("../controllers/productController");

const { productValidator } = require("../validators/productValidator");

const validate = require("../middlewares/validate");

const { protect } = require("../middlewares/authMiddleware");

const { authorize } = require("../middlewares/roleMiddleware");

const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve products with pagination, keyword search, category filtering, price filtering, and sorting.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *         example: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of products to return per page.
 *         example: 10
 *
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search products by name.
 *         example: headphones
 *
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category ID.
 *         example: 65a123456789abcdef123456
 *
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum product price.
 *         example: 500
 *
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum product price.
 *         example: 5000
 *
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field used to sort products.
 *         example: price
 *
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalProducts:
 *                   type: integer
 *                   example: 47
 *                 count:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get(
    "/", 
    getProducts
);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: Get low-stock products
 *     description: Retrieve products whose stock is less than or equal to their configured low-stock threshold.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Low stock products retrieved successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Admin access required.
 */
router.get(
    "/low-stock", 
    protect, 
    authorize("admin"), 
    getLowStockProducts
);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product.
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product retrived successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found.
 */
router.get(
    "/:id",
    getProduct
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     description: Create a product with an optional product image. Sellers and administrators can create products.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *               - stock
 *               - lowStockThreshold
 *             properties:
 *               name:
 *                 type: string
 *                 example: Wireless Headphones
 *               description:
 *                 type: string
 *                 example: High quality wireless Bluetooth headphones.
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 1999
 *               category:
 *                 type: string
 *                 example: 65a123456789abcdef123456
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 50
 *               lowStockThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional product image.
 *     responses:
 *       201:
 *         description: Product created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or category does not exist.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Seller or admin access required.
 */
router.post(
  "/",
  protect,
  authorize("seller", "admin"),
  upload.single("image"),
  productValidator,
  validate,
  createProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update product information and optionally replace its image. Sellers and administrators can update products.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product.
 *         example: 65a123456789abcdef123456
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Wireless Headphones
 *               description:
 *                 type: string
 *                 example: Updated product description.
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 1799
 *               category:
 *                 type: string
 *                 example: 65a123456789abcdef123456
 *               stock:
 *                 type: integer
 *                 minimum: 0
 *                 example: 25
 *               lowStockThreshold:
 *                 type: integer
 *                 minimum: 0
 *                 example: 5
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional replacement product image.
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Product updated successfully.
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error or category does not exist.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Seller or admin access required.
 *       404:
 *         description: Product not found.
 */
router.put(
  "/:id",
  protect,
  authorize("seller", "admin"),
  upload.single("image"),
  productValidator,
  validate,
  updateProduct,
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product and its associated Cloudinary image.
 *     tags:
 *       - Products
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the product.
 *         example: 65a123456789abcdef123456
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       401:
 *         description: Authentication required.
 *       403:
 *         description: Admin access required.
 *       404:
 *         description: Product not found.
 */
router.delete(
    "/:id", 
    protect, 
    authorize("admin"), 
    deleteProduct
);

module.exports = router;
