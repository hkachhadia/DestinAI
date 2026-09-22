"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const db_1 = require("./config/db");
async function bootstrap() {
    await (0, db_1.connectDB)();
    const app = (0, app_1.createApp)();
    const server = app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`DestinAI API listening on port ${env_1.env.PORT} [${env_1.env.NODE_ENV}]`);
        logger_1.logger.info(`API base path: ${env_1.env.API_PREFIX}`);
    });
    const shutdown = async (signal) => {
        logger_1.logger.info(`${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await (0, db_1.disconnectDB)();
            logger_1.logger.info("Shutdown complete.");
            process.exit(0);
        });
        // Force-exit if graceful shutdown hangs.
        setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("unhandledRejection", (reason) => {
        logger_1.logger.error(`Unhandled Rejection: ${reason}`);
    });
    process.on("uncaughtException", (error) => {
        logger_1.logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
        process.exit(1);
    });
}
bootstrap().catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Fatal error during bootstrap:", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map