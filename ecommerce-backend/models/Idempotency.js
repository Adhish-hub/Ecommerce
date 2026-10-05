const mongoose = require("mongoose");

const idempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    responseStatus: {
      type: Number,
    },

    responseBody: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// A user cannot reuse the same idempotency key,
// but different users can use the same key.
idempotencySchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Idempotency", idempotencySchema);
