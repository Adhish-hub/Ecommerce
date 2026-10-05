// const logger = require("../config/logger");

// const errorHandler = (err, req, res, next) => {
//     logger.error(err.message, {

//     })

//     const statusCode = err.statusCode || 500;

//     res.status(statusCode).json({
//         success: false,
//         message: err.message || "Internal server error",
//     });
// };

// module.exports = errorHandler;

const logger = require("../config/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const logPayload = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error(err.message, logPayload);
  } else {
    logger.warn(err.message, logPayload);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;