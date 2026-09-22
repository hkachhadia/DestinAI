"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const requestLogger_middleware_1 = require("./middlewares/requestLogger.middleware");
const rateLimiter_middleware_1 = require("./middlewares/rateLimiter.middleware");
const notFound_middleware_1 = require("./middlewares/notFound.middleware");
const error_middleware_1 = require("./middlewares/error.middleware");
const index_1 = __importDefault(require("./routes/index"));
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: env_1.env.CORS_ALLOWED_ORIGINS, credentials: true }));
    app.use(express_1.default.json({ limit: '1mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '1mb' }));
    app.use(requestLogger_middleware_1.requestLogger);
    app.use(env_1.env.API_PREFIX, rateLimiter_middleware_1.apiRateLimiter);
    app.use(env_1.env.API_PREFIX, index_1.default);
    app.use(notFound_middleware_1.notFoundHandler);
    app.use(error_middleware_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map