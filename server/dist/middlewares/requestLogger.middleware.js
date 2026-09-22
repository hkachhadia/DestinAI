"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const logger_1 = require("../config/logger");
const env_1 = require("../config/env");
const stream = {
    write: (message) => logger_1.logger.http?.(message.trim()) ?? logger_1.logger.info(message.trim()),
};
exports.requestLogger = (0, morgan_1.default)(env_1.env.IS_PRODUCTION ? "combined" : "dev", { stream });
//# sourceMappingURL=requestLogger.middleware.js.map