"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("./env");
const { combine, timestamp, printf, colorize, errors, json } = winston_1.default.format;
const devFormat = combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    // Include all metadata fields so [GEMINI] errors show HTTP status + message
    const metaStr = Object.keys(meta).length > 0 ? ' ' + JSON.stringify(meta) : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
}));
const prodFormat = combine(timestamp(), errors({ stack: true }), json());
exports.logger = winston_1.default.createLogger({
    level: env_1.env.LOG_LEVEL,
    format: env_1.env.IS_PRODUCTION ? prodFormat : devFormat,
    transports: [new winston_1.default.transports.Console()],
    exitOnError: false,
});
//# sourceMappingURL=logger.js.map