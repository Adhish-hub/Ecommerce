const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorMiddleware");
const swaggerSpec = require("./config/swagger");
const logger = require("./config/logger");
const redis = require("./config/redis");

const v1Routes = require("./routes/v1");
const healthRoutes = require("./routes/v1/healthRoutes");

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(helmet());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/v1/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const parts = message.trim().split(" ");
        logger.info("HTTP Request", {
          method: parts[0],
          url: parts[1],
          status: parts[2],
          responseTime: `${parts[3]} ${parts[4]}`,
        });
      },
    },
    skip: () => process.env.NODE_ENV === "test",
  }),
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl-api:",
  }),
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV === "test",
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl-auth:",
  }),
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
});

app.use("/health", healthRoutes);
app.use("/api/v1", apiLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", v1Routes);

app.get("/", (req, res) => {
  res.send("Welcome to Ecommerce Backend API");
});

app.use(errorHandler);

module.exports = app;
