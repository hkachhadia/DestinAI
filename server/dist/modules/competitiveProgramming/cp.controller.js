"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect = connect;
exports.sync = sync;
exports.syncAll = syncAll;
exports.getProfiles = getProfiles;
const ApiResponse_1 = require("../../utils/ApiResponse");
const cp_service_1 = require("./cp.service");
async function connect(req, res) {
    const { platform, handle } = req.body;
    const profile = await (0, cp_service_1.connectPlatform)(req.user.id, platform, handle);
    return res.status(201).json((0, ApiResponse_1.ok)(req, profile));
}
async function sync(req, res) {
    const { platform } = req.params;
    const profile = await (0, cp_service_1.syncPlatform)(req.user.id, platform);
    return res.json((0, ApiResponse_1.ok)(req, profile));
}
async function syncAll(req, res) {
    const profiles = await (0, cp_service_1.syncAllPlatforms)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, profiles));
}
async function getProfiles(req, res) {
    const profiles = await (0, cp_service_1.getAllProfiles)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, profiles));
}
//# sourceMappingURL=cp.controller.js.map