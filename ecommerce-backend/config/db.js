const mongoose = require("mongoose");
const logger = require("./logger");

const uri =
  "mongodb://adishtiwari_db_user:282003adhish@ac-lfu6lk6-shard-00-00.caioygk.mongodb.net:27017,ac-lfu6lk6-shard-00-01.caioygk.mongodb.net:27017,ac-lfu6lk6-shard-00-02.caioygk.mongodb.net:27017/?ssl=true&replicaSet=atlas-sbhz5r-shard-0&authSource=admin&appName=Cluster0";
const connectDb = async () => {
  try {
    await mongoose.connect(uri);

    logger.info("MongoDb connected");
  } catch (error) {
     logger.error("Database connection failed", { error: error.message });

    process.exit(1);
  }
};

module.exports = connectDb;
// const mongoose = require("mongoose");
// const logger = require("./logger");

// const uri = process.env.MONGODB_URI;

// const connectDb = async () => {
//   try {
//     await mongoose.connect(uri);
//     logger.info("MongoDB connected");
//   } catch (error) {
//     logger.error("Database connection failed", { error: error.message });
//     process.exit(1);
//   }
// };

// module.exports = connectDb;