const logger = require("../config/logger");

let emailWorker;
let notificationWorker;

const startWorkers = () => {
  emailWorker = require("./emailWorker");
  notificationWorker = require("./notificationWorker");

  logger.info("Background workers started");
};

const closeWorkers = async () => {
  await Promise.all([emailWorker?.close(), notificationWorker?.close()]);

  logger.info("Background workers closed");
};

module.exports = { startWorkers, closeWorkers };
