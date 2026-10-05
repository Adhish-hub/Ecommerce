const express = require("express");
const mongoose = require("mongoose");
const redis = require("../../config/redis");
const queueConnection = require("../../config/queue");

const router = express.Router();

const dbStates = ["disconnected", "connected", "connecting", "disconnecting"];

const checkMongo = () => {
  const state = mongoose.connection.readyState;
  return {
    status: dbStates[state] || "unknown",
    healthy: state === 1,
  };
};

const checkRedis = async () => {
  try {
    const pong = await redis.ping();
    return {
      status: pong === "PONG" ? "connected" : "unknown",
      healthy: pong === "PONG",
    };
  } catch (error) {
    return { status: "disconnected", healthy: false, error: error.message };
  }
};

const checkQueueRedis = async () => {
  try {
    const pong = await queueConnection.ping();
    return {
      status: pong === "PONG" ? "connected" : "unknown",
      healthy: pong === "PONG",
    };
  } catch (error) {
    return { status: "disconnected", healthy: false, error: error.message };
  }
};

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Process is alive
 */
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "alive",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is ready to accept traffic
 *       503:
 *         description: One or more dependencies are unavailable
 */
router.get("/ready", async (req, res) => {
  const mongo = checkMongo();
  const cache = await checkRedis();
  const queue = await checkQueueRedis();

  const isReady = mongo.healthy && cache.healthy && queue.healthy;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    status: isReady ? "ready" : "not_ready",
    dependencies: {
      mongodb: mongo,
      redisCache: cache,
      redisQueue: queue,
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
