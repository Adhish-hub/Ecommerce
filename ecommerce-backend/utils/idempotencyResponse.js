const Idempotency = require("../models/Idempotency");

const completeIdempotency = async (req, statusCode, responseBody) => {
  if (!req.idempotencyKey) {
    return;
  }

  await Idempotency.findOneAndUpdate(
    {
      key: req.idempotencyKey,
      user: req.user._id,
    },
    {
      status: "completed",
      responseStatus: statusCode,
      responseBody,
    },
  );
};

const failIdempotency = async (req) => {
  if (!req.idempotencyKey) {
    return;
  }

  await Idempotency.findOneAndUpdate(
    {
      key: req.idempotencyKey,
      user: req.user._id,
    },
    {
      status: "failed",
    },
  );
};

module.exports = {
  completeIdempotency,
  failIdempotency,
};
