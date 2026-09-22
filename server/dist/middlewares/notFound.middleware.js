"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
const ApiError_1 = require("../utils/ApiError");
function notFoundHandler(req, _res, next) {
    next(ApiError_1.ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
}
//# sourceMappingURL=notFound.middleware.js.map