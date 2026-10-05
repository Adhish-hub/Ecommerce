require("dotenv").config({
    path: ".env.test",
});

const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let mongoServer;

jest.mock("../config/razorpay", () => ({
    orders: {
        create: jest.fn(),
    },
}));
jest.mock("../config/redis", () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
  call: jest.fn().mockResolvedValue(null),
  on: jest.fn(),
}));

jest.mock("../queues/emailQueue", () => ({
  add: jest.fn().mockResolvedValue({}),
}));

jest.mock("../queues/notificationQueue", () => ({
  add: jest.fn().mockResolvedValue({}),
}));

beforeAll(async () => {
  mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }

  jest.clearAllMocks();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});

