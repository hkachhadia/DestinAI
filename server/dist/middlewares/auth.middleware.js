"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = require("../utils/ApiError");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return next(ApiError_1.ApiError.unauthorized('Missing or malformed Authorization header'));
    }
    const token = header.slice('Bearer '.length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = {
            userId: payload.sub,
            id: payload.sub,
            email: payload.email,
            role: payload.role ?? 'user',
        };
        return next();
    }
    catch {
        return next(ApiError_1.ApiError.unauthorized('Access token is invalid or expired', 'TOKEN_INVALID'));
    }
}
exports.authMiddleware = requireAuth;
//# sourceMappingURL=auth.middleware.js.map