const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema(
    {
        product : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        
        name : {
            type: String,
            required: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        
    },
    {
        _id: false,
    }
);


const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  orderItems: [orderItemSchema],

  shippingAddress: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
  },

  paymentMethod: {
    type: String,
    enum: ["COD", "Stripe", "Razorpay"],
    default: "COD",
  },

  razorpayOrderId: {
    type: String,
  },

  razorpayPaymentId: {
    type: String,
  },

  razorpaySignature: {
    type: String,
  },

  paidAt: {
    type: Date,
  },

  itemsPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },

  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },

  orderStatus: {
    type: String,
    enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
    default: "placed",
  },

//   paidAt: {
//     type: Date,
//   },

  deliveredAt: {
    type: Date
  },
},
{
    timestamps: true,
},
);


orderSchema.index({ user: 1, createdAt: -1 });

orderSchema.index({ orderStatus: 1, createdAt: -1 });

orderSchema.index({ paymentStatus: 1, createdAt: -1 });

orderSchema.index({ createdAt: -1 });


module.exports = mongoose.model("Order", orderSchema);