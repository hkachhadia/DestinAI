"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.errorMiddleware = errorHandler;
const mongoose_1 = require("mongoose");
const ApiError_1 = require("../utils/ApiError");
const logger_1 = require("../config/logger");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, _next) {
    if (err instanceof ApiError_1.ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            data: null,
            message: err.message,
            error: { code: err.code, message: err.message, details: err.details },
        });
    }
    if (err instanceof mongoose_1.Error.ValidationError) {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            success: false,
            data: null,
            message: messages.join('; '),
            error: { code: ApiError_1.ErrorCodes.VALIDATION_ERROR, message: messages.join('; ') },
        });
    }
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            data: null,
            message: 'A record with that value already exists',
            error: { code: 'DUPLICATE_KEY', message: 'A record with that value already exists' },
        });
    }
    logger_1.logger.error('Unhandled error', { error: err, path: req.path, method: req.method });
    return res.status(500).json({
        success: false,
        data: null,
        message: 'An unexpected error occurred',
        error: { code: ApiError_1.ErrorCodes.UNKNOWN_ERROR, message: 'An unexpected error occurred' },
    });
}
//# sourceMappingURL=error.middleware.js.map