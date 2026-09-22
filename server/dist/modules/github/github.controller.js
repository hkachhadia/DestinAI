"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = connect;
exports.sync = sync;
exports.getProfile = getProfile;
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const github_service_1 = require("./github.service");
async function connect(req, res) {
    const { username } = req.body;
    await (0, github_service_1.connectGitHub)(req.user.id, username);
    const synced = await (0, github_service_1.syncGitHubProfile)(req.user.id);
    return res.status(201).json((0, ApiResponse_1.ok)(req, synced));
}
async function sync(req, res) {
    const profile = await (0, github_service_1.syncGitHubProfile)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, profile));
}
async function getProfile(req, res) {
    const profile = await (0, github_service_1.getGitHubProfile)(req.user.id);
    if (!profile)
        throw new ApiError_1.ApiError(404, 'No GitHub account connected', ApiError_1.ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
    return res.json((0, ApiResponse_1.ok)(req, profile));
}
//# sourceMappingURL=github.controller.js.map