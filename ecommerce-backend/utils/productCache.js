const redis = require("../config/redis");

const clearProductCache = async (id) => {
  const keys = await redis.keys("products:*");
  if (keys.length > 0) await redis.del(...keys);
  if (id) await redis.del(`product:${id}`);
};

module.exports = clearProductCache;
