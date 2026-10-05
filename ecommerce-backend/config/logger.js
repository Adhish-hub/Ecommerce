const winston = require("winston");
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),

  defaultMeta: { service: "ecommerce-backend" },

  transports: [
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
    }),
  ],
});

// Pretty console output outside production
if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        }),
      ),
    }),
  );
}

// Never write log files during tests
if (process.env.NODE_ENV === "test") {
  logger.transports.forEach((t) => {
    if (t instanceof winston.transports.File) {
      t.silent = true;
    }
  });
}

module.exports = logger;
