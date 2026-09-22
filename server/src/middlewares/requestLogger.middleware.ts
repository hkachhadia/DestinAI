import morgan, { StreamOptions } from "morgan";
import { logger } from "@config/logger";
import { env } from "@config/env";

const stream: StreamOptions = {
  write: (message) => logger.http?.(message.trim()) ?? logger.info(message.trim()),
};

export const requestLogger = morgan(env.IS_PRODUCTION ? "combined" : "dev", { stream });
