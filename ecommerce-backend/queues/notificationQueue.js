const { Queue } = require("bullmq");

const connection = require("../config/queue");

const notificationQueue = new Queue("notification", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

module.exports = notificationQueue;