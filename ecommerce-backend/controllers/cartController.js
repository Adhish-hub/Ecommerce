const User = require("../models/User");

const Product = require("../models/Product");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const addToCart = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const productId = req.params.productId;

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const requestedQuantity = Number(quantity) || 1;

  if (requestedQuantity < 1) {
    throw new ApiError(400, "The quantity should be atleast 1");
  }

  const existingItem = user.cart.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + requestedQuantity;

    if (newQuantity > product.stock) {
      throw new ApiError(
        400,
        `Only ${product.stock} units are available in stock.`,
      );
    }

    existingItem.quantity = newQuantity;
  } else{ 
    if (requestedQuantity > product.stock) {
    throw new ApiError(
      400,
      `Only ${product.stock} units are available in stock.`,
    );
  }
   user.cart.push({
    product: productId,
    quantity: requestedQuantity,
   });
}

  await user.save();

  await user.populate("cart.product", "name price image");

  sendResponse(res, 200, "Product added to the cart.", user.cart);
});

const getCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "cart.product",
    "name price image",
  );

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  let totalItems = 0;
  let totalPrice = 0;

  user.cart.forEach((item) => {
    totalItems += item.quantity;

    totalPrice += item.product.price * item.quantity;
  });

  sendResponse(res, 200, "Cart retrieved successfully.", {
    items: user.cart,
    totalItems,
    totalPrice,
  });
});

const updateCartQuantity = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const productId = req.params.productId;

  const newQuantity = Number(quantity);

  if (!newQuantity || newQuantity < 1) {
    throw new ApiError(400, "The quantity should be atleast 1.");
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const cartItem = user.cart.find(
    (item) => item.product.toString() === productId,
  );

  if (!cartItem) {
    throw new ApiError(404, "Product is not in the cart.");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  if (newQuantity > product.stock) {
    throw new ApiError(
      400,
      `Only ${product.stock} units are available in stock.`,
    );
  }

  cartItem.quantity = newQuantity;

  await user.save();

  await user.populate("cart.product", "name price image");

  sendResponse(res, 200, "Cart quantity updated successfully.", user.cart);
});

const removeFromCart = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const cartItemExist = user.cart.some(
    (item) => item.product.toString() === productId,
  );

  if (!cartItemExist) {
    throw new ApiError(404, "Product is not in the cart.");
  }

  user.cart = user.cart.filter((item) => item.product.toString() !== productId);

  await user.save();

  await user.populate("cart.product", "name price image");

  sendResponse(res, 200, "Product removed from the cart.", user.cart);
});

const clearCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.cart = [];

  await user.save();

  sendResponse(res, 200, "Cart cleared successfully.");
});

module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
};
