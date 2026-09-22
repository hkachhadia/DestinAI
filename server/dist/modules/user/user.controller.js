"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const user_service_1 = require("./user.service");
const auth_types_1 = require("../auth/auth.types");
exports.userController = {
    getMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const user = await user_service_1.userService.getById(req.user.userId);
        return ApiResponse_1.ApiResponse.ok(res, (0, auth_types_1.toPublicUser)(user), 'Profile fetched');
    }),
    updateMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const user = await user_service_1.userService.updateProfile(req.user.userId, req.body);
        return ApiResponse_1.ApiResponse.ok(res, (0, auth_types_1.toPublicUser)(user), 'Profile updated');
    }),
    deleteMe: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        await user_service_1.userService.deleteAccount(req.user.userId);
        return ApiResponse_1.ApiResponse.ok(res, null, 'Account deleted');
    }),
    getSettings: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const settings = await user_service_1.userService.getSettings(req.user.userId);
        return ApiResponse_1.ApiResponse.ok(res, settings, 'Settings fetched');
    }),
    updateSettings: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const settings = await user_service_1.userService.updateSettings(req.user.userId, req.body);
        return ApiResponse_1.ApiResponse.ok(res, settings, 'Settings updated');
    }),
};
//# sourceMappingURL=user.controller.js.map