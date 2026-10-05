const { Worker } = require("bullmq");

const connection = require("../config/queue");

const logger = require("../config/logger");

const notificationWorker = new Worker(
  "notification",
  async (job) => {
    const { type, orderId, userEmail, totalPrice } = job.data;

    if (type === "order-confirmation") {
      // Simulated notification — replace with real email/SMS
      logger.info("Order confirmation sent", {
        orderId,
        userEmail,
        totalPrice,
      });
    }
  },
  { connection },
);

notificationWorker.on("completed", (job) => {
  logger.info("Notification job completed", {
    jobId: job.id,
    type: job.data.type,
  });
});

notificationWorker.on("failed", (job, err) => {
  logger.error("Notification job failed", {
    jobId: job?.id,
    error: err.message,
  });
});

module.exports = notificationWorker;