const express = require("express");

const authRoutes = require("./authRoutes");
const cartRoutes = require("./cartRoutes");
const categoryRoutes = require("./categoryRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const productRoutes = require("./productRoutes");
const reviewRoutes = require("./reviewRoutes");
const userRoutes = require("./userRoutes");
const wishlistRoutes = require("./wishlistRoutes");

const router = express.Router();

router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/auth", authRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/products", reviewRoutes);

module.exports = router;
