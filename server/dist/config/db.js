"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const logger_1 = require("./logger");
mongoose_1.default.set("strictQuery", true);
async function connectDB() {
    try {
        mongoose_1.default.connection.on("connected", () => {
            logger_1.logger.info("MongoDB connected");
        });
        mongoose_1.default.connection.on("error", (err) => {
            logger_1.logger.error(`MongoDB connection error: ${err}`);
        });
        mongoose_1.default.connection.on("disconnected", () => {
            logger_1.logger.warn("MongoDB disconnected");
        });
        await mongoose_1.default.connect(env_1.env.MONGO_URI);
    }
    catch (error) {
        logger_1.logger.error(`Failed to connect to MongoDB: ${error.message}`);
        process.exit(1);
    }
}
async function disconnectDB() {
    await mongoose_1.default.disconnect();
}
//# sourceMappingURL=db.js.map