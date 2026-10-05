const { body } = require("express-validator");

const productValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2 })
    .withMessage("Product name must be at least 2 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Product description is required"),

  body("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isFloat({ min: 0 })
    .withMessage("Product price must be a positive number"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),

  body("stock")
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),

  body("lowStockThreshold")
    .notEmpty()
    .withMessage("Low stock threshold is required")
    .isInt({ min: 0 })
    .withMessage("Low stock threshold must be a non-negative integer"),
];

module.exports = { productValidator };
