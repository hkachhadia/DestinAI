"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const auth_service_1 = require("./auth.service");
const user_model_1 = require("../user/user.model");
const auth_types_1 = require("./auth.types");
exports.authController = {
    signup: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.authService.signup(req.body);
        return ApiResponse_1.ApiResponse.created(res, result, "Account created successfully");
    }),
    login: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.authService.login(req.body);
        return ApiResponse_1.ApiResponse.ok(res, result, "Logged in successfully");
    }),
    refresh: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        const result = await auth_service_1.authService.refresh(req.body.refreshToken);
        return ApiResponse_1.ApiResponse.ok(res, result, "Token refreshed successfully");
    }),
    logout: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        await auth_service_1.authService.logout(req.user.userId);
        return ApiResponse_1.ApiResponse.ok(res, null, "Logged out successfully");
    }),
    /** GET /auth/me — also exposed as GET /users/me by the user module. */
    me: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const user = await user_model_1.UserModel.findById(req.user.userId);
        if (!user)
            throw ApiError_1.ApiError.notFound("User not found");
        return ApiResponse_1.ApiResponse.ok(res, (0, auth_types_1.toPublicUser)(user), "Current user fetched");
    }),
};
//# sourceMappingURL=auth.controller.js.map