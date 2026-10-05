const User = require("../models/User");

const bcrypt = require("bcrypt");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const sendResponse = require("../utils/sendResponse");

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  //these three details will go into the body

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "customer",
  });

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  sendResponse(res, 201, "User created successfully", userResponse);
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select(
    "-password -refreshTokenHash -refreshTokenExpiresAt",
  );

  sendResponse(res, 200, "Users retrieved successfully", users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshTokenHash -refreshTokenExpiresAt",
  );

  if (!user) {
    throw new ApiError(404, "User not found.");
  }
  sendResponse(res, 200, "User retrieved successfully", user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (email !== undefined) {
    user.email = email;
  }

  if (password !== undefined) {
    user.password = await bcrypt.hash(password, 10);
  }

  if (role !== undefined) {
    user.role = role;
  }

  await user.save();

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  sendResponse(res, 200, "User updated successfully", userResponse);
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "You can not delete your own admin account.");
  }

  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  sendResponse(res, 200, "User deleted successfully");
});

module.exports = { createUser, getUsers, getUser, updateUser, deleteUser };
