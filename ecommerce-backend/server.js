require("dotenv").config();

const app = require("./app");
const connectDb = require("./config/db");
const logger = require("./config/logger");
const { startWorkers, closeWorkers } = require("./workers");
const mongoose = require("mongoose");
const redis = require("./config/redis");
const queueConnection = require("./config/queue");

const PORT = process.env.PORT || 5000;
const SHUTDOWN_TIMEOUT_MS = 10000;

let server;
let isShuttingDown = false;

const startServer = async () => {
  try {
    await connectDb();

    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      startWorkers();
    });
  } catch (error) {
    logger.error("Failed to start server", { error: error.message });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out. Forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info("HTTP server closed. No longer accepting new connections.");
    }

    await closeWorkers();

    await mongoose.connection.close();
    logger.info("MongoDB connection closed.");

    await redis.quit();
    logger.info("Redis (cache) connection closed.");

    await queueConnection.quit();
    logger.info("Redis (queue) connection closed.");

    clearTimeout(forceExitTimer);
    logger.info("Graceful shutdown complete.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", { error: error.message });
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: reason?.message || reason });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

startServer();
