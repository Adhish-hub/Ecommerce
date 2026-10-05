const redis = require("../config/redis");

const clearProductCache = require("../utils/productCache")

const clearProductListCache = async () => {
  const keys = await redis.keys("products:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

const Product = require("../models/Product");

const Category = require("../models/Category");

const fs = require("fs");

const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = require("../utils/uploadToCloudinary");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, lowStockThreshold } =
    req.body;

  const existingCategory = await Category.findById(category);

  if (!existingCategory) {
    throw new ApiError(400, "Category does not exist.");
  }

  // const image = req.file ? req.file.path : "";

  let image = {
    url: "",
    public_id: "",
  };

  if (req.file) {
    image = await uploadToCloudinary(req.file.path);

    fs.unlinkSync(req.file.path);
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    image,
    stock,
    lowStockThreshold,
  });

  sendResponse(res, 201, "Product created successfully.", product);
});

// const getProducts = asyncHandler(async (req, res) => {
//   const page = Number(req.query.page) || 1;
//   const limit = Number(req.query.limit) || 10;
//   const skip = (page - 1) * limit;
//   //the above three variables are used for pagiation

//   const keyword = req.query.keyword || "";
//   //this is used for the search

//   const category = req.query.category;
//   const minPrice = req.query.minPrice;
//   const maxPrice = req.query.maxPrice;
//   //the above three are used for filter

//   const sort = req.query.sort || "createdAt";
//   //this is used for sorting

//   let searchQuery = {};

//   if (keyword) {
//     searchQuery.name = {
//       $regex: keyword,
//       $options: "i",
//     };
//   }

//   if (category) {
//     searchQuery.category = category;
//   }

//   if (minPrice) {
//     searchQuery.price = {
//       ...searchQuery.price,
//       $gte: Number(minPrice),
//     };
//   }

//   if (maxPrice) {
//     searchQuery.price = {
//       ...searchQuery.price,
//       $lte: Number(maxPrice),
//     };
//   }

//   const totalProducts = await Product.countDocuments(searchQuery);

//   const products = await Product.find(searchQuery)
//     .populate("category", "name")
//     .sort(sort)
//     .skip(skip)
//     .limit(limit);

//   const totalPages = Math.ceil(totalProducts / limit);

//   res.status(200).json({
//     success: true,
//     page,
//     limit,
//     totalPages,
//     totalProducts,
//     count: products.length,
//     data: products,
//   });
// });

const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const keyword = req.query.keyword || "";
  const category = req.query.category;
  const minPrice = req.query.minPrice;
  const maxPrice = req.query.maxPrice;
  const sort = req.query.sort || "createdAt";

  const cacheKey = `products:${JSON.stringify({
    page,
    limit,
    keyword,
    category,
    minPrice,
    maxPrice,
    sort,
  })}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.status(200).json(JSON.parse(cached));
  }

  let searchQuery = {};

  if (keyword) {
    searchQuery.name = {
      $regex: keyword,
      $options: "i",
    };
  }

  if (category) {
    searchQuery.category = category;
  }

  if (minPrice) {
    searchQuery.price = {
      ...searchQuery.price,
      $gte: Number(minPrice),
    };
  }

  if (maxPrice) {
    searchQuery.price = {
      ...searchQuery.price,
      $lte: Number(maxPrice),
    };
  }

  const totalProducts = await Product.countDocuments(searchQuery);

  const products = await Product.find(searchQuery)
    .populate("category", "name")
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalProducts / limit);

  const responseBody = {
    success: true,
    page,
    limit,
    totalPages,
    totalProducts,
    count: products.length,
    data: products,
  };

  await redis.set(cacheKey, JSON.stringify(responseBody), "EX", 300);

  res.status(200).json(responseBody);
});

// const getProduct = asyncHandler(async (req, res) => {
//   const product = await Product.findById(req.params.id).populate(
//     "category",
//     "name",
//   );

//   if (!product) {
//     throw new ApiError(404, "Product not found.");
//   }

//   sendResponse(res, 200, "Product retrived successfully.", product);
// });

const getProduct = asyncHandler(async (req, res) => {
  const cacheKey = `product:${req.params.id}`;

  const cached = await redis.get(cacheKey);

  if (cached) {
    return sendResponse(
      res,
      200,
      "Product retrived successfully.",
      JSON.parse(cached),
    );
  }

  const product = await Product.findById(req.params.id).populate(
    "category",
    "name",
  );

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  await redis.set(cacheKey, JSON.stringify(product), "EX", 300);

  sendResponse(res, 200, "Product retrived successfully.", product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  if (req.body.category) {
    const existingCategory = await Category.findById(req.body.category);

    if (!existingCategory) {
      throw new ApiError(400, "Category does not exist.");
    }
  }

  //now that we are using cloudinary we will have a differrent approach when we update our product especially our image.
  if (req.file) {
    // the code below deletes old immages from cloudinary
    if (product.image.public_id) {
      await cloudinary.uploader.destroy(product.image.public_id);
    }

    //the code below uploads new images
    const uploadImage = await uploadToCloudinary(req.file.path);

    // the code below deletes temprory local files
    fs.unlinkSync(req.file.path);

    // the code below saves new images
    product.image = uploadImage;
  }

  // Update only fields that were provided
  if (req.body.name !== undefined) {
    product.name = req.body.name;
  }

  if (req.body.description !== undefined) {
    product.description = req.body.description;
  }

  if (req.body.price !== undefined) {
    product.price = req.body.price;
  }

  if (req.body.category !== undefined) {
    product.category = req.body.category;
  }

  // Inventory fields
  if (req.body.stock !== undefined) {
    product.stock = req.body.stock;
  }

  if (req.body.lowStockThreshold !== undefined) {
    product.lowStockThreshold = req.body.lowStockThreshold;
  }

  await product.save();

  await clearProductCache(req.params.id);

  await product.populate("category", "name");

  sendResponse(res, 200, "Product updated successfully.", product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  // const product = await Product.findByIdAndDelete(req.params.id);
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }
  //the code below was added when cloudinary was inroduced in this app as we have to follow a different approach to delete the product.
  if (product.image.public_id) {
    await cloudinary.uploader.destroy(product.image.public_id);
  }

  await product.deleteOne();

  await clearProductCache(req.params.id);

  sendResponse(res, 200, "Product deleted successfully.");
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    $expr: {
      $lte: ["$stock", "$lowStockThreshold"],
    },
  })
    .populate("category", "name")
    .sort({ stock: 1 });

  sendResponse(res, 200, "Low stock products retrieved successfully.", {
    count: products.length,
    data: products,
  });
});

module.exports = {
  createProduct,
  getProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
};
