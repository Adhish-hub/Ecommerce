const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "seller", "admin"],
      default: "customer",
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    cart: [cartItemSchema],


    resetPasswordOtpHash: {
      type: String,
    },

    resetPasswordOtpExpiresAt: {
      type: Date,
    },

    resetPasswordOtpAttempts: {
      type: Number,
      default: 0,
    },
    
    passwordResetTokenHash: {
      type: String,
      default: null,
    },

    passwordResetTokenExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);

// {
//     "name": "Adhish Tiwari",
//     "email": "tiwari@123gmail.com",
//     "password": "0147258"
// }

// {
//     "name": "Arya",
//     "email": "arya@gmail.com",
//     "password": "9637410"
// }

// name: Veer
// email: veer.sharma123@gmail.com
// password: 8520147

// {
//   "name": "Test Seller",
//   "email": "seller1@example.com",
//   "password": "password123",
//   "role": "seller"
// }