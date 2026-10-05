const OIRedis = require("ioredis");

const logger = require("./logger");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// BullMQ requires its own Redis connection with maxRetriesPerRequest: null
const connection = new OIRedis(redisUrl, { maxRetriesPerRequest: null });

connection.on("connect", () => {
    logger.info("BullMQ Redis connection established.");
});

connection.on("error", (error) => {
    logger.error("BullMQ Redis connection error.", { error: error.message });
});

module.exports = connection;