const { body } = require("express-validator");

const createOrderValidator = [
  body("shippingAddress.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required"),

  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("shippingAddress.postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal code is required"),

  body("shippingAddress.country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),

  body("paymentMethod")
    .optional()
    .isIn(["COD", "Razorpay"])
    .withMessage("Invalid payment method"),
];

module.exports = { createOrderValidator };
