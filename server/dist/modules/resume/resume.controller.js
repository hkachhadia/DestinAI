"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const resume_service_1 = require("./resume.service");
exports.resumeController = {
    upload: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        if (!req.file)
            throw ApiError_1.ApiError.badRequest("No file uploaded. Field name must be 'resume'.");
        const resume = await (0, resume_service_1.uploadAndParseResume)({
            userId: req.user.userId,
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            buffer: req.file.buffer,
        });
        return ApiResponse_1.ApiResponse.created(res, resume, 'Resume uploaded and parsed');
    }),
    getMine: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const resume = await (0, resume_service_1.getLatestResume)(req.user.userId);
        return ApiResponse_1.ApiResponse.ok(res, resume, 'Latest resume fetched');
    }),
    getById: (0, asyncHandler_1.asyncHandler)(async (req, res) => {
        if (!req.user)
            throw ApiError_1.ApiError.unauthorized();
        const resume = await (0, resume_service_1.getResumeById)(req.user.userId, req.params.id);
        return ApiResponse_1.ApiResponse.ok(res, resume, 'Resume fetched');
    }),
};
//# sourceMappingURL=resume.controller.js.map