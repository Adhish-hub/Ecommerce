const { Worker } = require("bullmq");

const connection = require("../config/queue");

const logger = require("../config/logger");

const emailWorker = new Worker(
    "email",
    async(job) => {
        const { type, email, otp } = job.data;

        if(type === "password-reset-otp"){
            if(process.env.NODE_ENV !== "production"){
                logger.debug(`[Simulated Email] Password reset OTP for ${email}: ${otp}`);
            }else{
                logger.info(`Password reset, OTP email is sent to ${email}`);
            }
        }
    },
    { connection },
);

emailWorker.on("completed", (job) => {
    logger.info("Email job completed", { jobId: job.id, type: job.data.type });
});

emailWorker.on("Failed", (job, err) => {
    logger.info("Email job failed", { jobId: job?.id, error: err.message });
});

module.exports = emailWorker;