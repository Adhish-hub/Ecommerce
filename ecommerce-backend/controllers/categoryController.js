const redis = require("../config/redis");

const Category = require("../models/Category");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  const category = await Category.create({ name });

  await redis.del("categories:all");

  sendResponse(res, 201, "Category created successfully.", category);
});

// const getCategories = asyncHandler(async (req, res) => {
//   const categories = await Category.find();

//   sendResponse(res, 200, "Categories retrieved successfully", categories);
// });

const getCategories = asyncHandler(async (req, res) => {
  const cacheKey = "categories:all";

  const cached = await redis.get(cacheKey);

  if (cached) {
    return sendResponse(
      res,
      200,
      "Categories retrieved successfully",
      JSON.parse(cached),
    );
  }

  const categories = await Category.find();

  await redis.set(cacheKey, JSON.stringify(categories), "EX", 600);

  sendResponse(res, 200, "Categories retrieved successfully", categories);
});

// const getCategory = asyncHandler(async (req, res) => {
//   const category = await Category.findById(req.params.id);

//   if (!category) {
//     throw new ApiError(404, "Category not found.");
//   }

//   sendResponse(res, 200, "Category retrieved successfully", category);
// });

const getCategory = asyncHandler(async (req, res) => {
  const cacheKey = `category:${req.params.id}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return sendResponse(
      res,
      200,
      "Category retrieved successfully",
      JSON.parse(cached),
    );
  }

  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  await redis.set(cacheKey, JSON.stringify(category), "EX", 600);

  sendResponse(res, 200, "Category retrieved successfully", category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  await redis.del(`category:${category._id}`);
  await redis.del("categories:all");

  sendResponse(res, 200, "Category updated successfully", category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    throw new ApiError(404, "Category not found.");
  }

  await redis.del(`category:${req.params.id}`);
  await redis.del("categories:all");

  sendResponse(res, 200, "Category deleted successfully");
});

module.exports = {
  createCategory,
  getCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
