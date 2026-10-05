const Redis = require("ioredis");
const logger = require("./logger");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on("connect", () => {
  logger.info("Redis connected");
});

redis.on("error", (error) => {
  logger.error("Redis connection error", { error: error.message });
});

module.exports = redis;
