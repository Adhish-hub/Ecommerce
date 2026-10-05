const Idempotency = require("../models/Idempotency");

const asyncHandler = require("./asyncHandler");

const ApiError = require("../utils/ApiError");

const idempotencyMiddleware = asyncHandler(async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];

  if (!idempotencyKey) {
    throw new ApiError(400, "Idempotency-Key header is required.");
  }

  if (!req.user) {
    throw new ApiError(401, "Authentication required.");
  }

  const existingRequest = await Idempotency.findOne({
    key: idempotencyKey,
    user: req.user._id,
  });

  // If this key was already completed,
  // return the exact previous response.
  if (existingRequest && existingRequest.status === "completed") {
    return res
      .status(existingRequest.responseStatus)
      .json(existingRequest.responseBody);
  }

  // If the same request is currently being processed,
  // don't allow it to run again.
  if (existingRequest && existingRequest.status === "processing") {
    throw new ApiError(409, "This request is already being processed.");
  }

  // If the previous request failed,
  // allow the client to retry using the same key.
  if (existingRequest && existingRequest.status === "failed") {
    await Idempotency.findOneAndUpdate(
      {
        key: idempotencyKey,
        user: req.user._id,
      },
      {
        status: "processing",
        responseStatus: undefined,
        responseBody: undefined,
      },
    );

    req.idempotencyKey = idempotencyKey;

    return next();
  }

  // Create a record for this new request.
  try {
    await Idempotency.create({
      key: idempotencyKey,
      user: req.user._id,
      status: "processing",
    });
  } catch (error) {
    // Another request may have created the same key
    // at almost exactly the same time.
    if (error.code === 11000) {
      throw new ApiError(409, "This request is already being processed.");
    }

    throw error;
  }

  // Save the key on the request so that
  // the controller can update the record later.
  req.idempotencyKey = idempotencyKey;

  next();
});

module.exports = idempotencyMiddleware;
