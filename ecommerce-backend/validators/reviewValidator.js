const { body } = require("express-validator");

const reviewValidator = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Comment must be between 3 and 500 characters"),
];

module.exports = { reviewValidator };
