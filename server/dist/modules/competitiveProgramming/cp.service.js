"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectPlatform = connectPlatform;
exports.syncPlatform = syncPlatform;
exports.syncAllPlatforms = syncAllPlatforms;
exports.getAllProfiles = getAllProfiles;
const mongoose_1 = require("mongoose");
const cp_model_1 = require("./cp.model");
const leetcodeAdapter_1 = require("./adapters/leetcodeAdapter");
const codeforcesAdapter_1 = require("./adapters/codeforcesAdapter");
const codechefAdapter_1 = require("./adapters/codechefAdapter");
const gfgAdapter_1 = require("./adapters/gfgAdapter");
const hackerrankAdapter_1 = require("./adapters/hackerrankAdapter");
const ApiError_1 = require("../../utils/ApiError");
const ADAPTERS = {
    leetcode: leetcodeAdapter_1.leetcodeAdapter,
    codeforces: codeforcesAdapter_1.codeforcesAdapter,
    codechef: codechefAdapter_1.codechefAdapter,
    gfg: gfgAdapter_1.gfgAdapter,
    hackerrank: hackerrankAdapter_1.hackerrankAdapter,
};
function assertSupportedPlatform(platform) {
    if (!cp_model_1.CP_PLATFORMS.includes(platform)) {
        throw new ApiError_1.ApiError(400, `Unsupported platform "${platform}". Supported: ${cp_model_1.CP_PLATFORMS.join(', ')}`, ApiError_1.ErrorCodes.CP_PLATFORM_UNSUPPORTED);
    }
}
async function connectPlatform(userId, platform, handle) {
    assertSupportedPlatform(platform);
    await cp_model_1.CompetitiveProfile.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId), platform }, { userId: new mongoose_1.Types.ObjectId(userId), platform, handle }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return syncPlatform(userId, platform);
}
async function syncPlatform(userId, platform) {
    assertSupportedPlatform(platform);
    const profile = await cp_model_1.CompetitiveProfile.findOne({ userId: new mongoose_1.Types.ObjectId(userId), platform });
    if (!profile)
        throw new ApiError_1.ApiError(404, `No ${platform} handle connected`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
    try {
        const stats = await ADAPTERS[platform].fetchProfile(profile.handle);
        profile.stats = stats;
        profile.lastSyncedAt = new Date();
        profile.lastSyncError = undefined;
        await profile.save();
        return profile;
    }
    catch (err) {
        profile.lastSyncError = err instanceof Error ? err.message : 'Unknown sync error';
        profile.lastSyncedAt = new Date();
        await profile.save();
        throw err;
    }
}
/** Syncs every platform the user has connected, in parallel. Individual
 * platform failures don't fail the whole batch — each is recorded on its
 * own document via lastSyncError, and the scoring engine simply treats an
 * unsynced platform as 0 contribution rather than blocking the analysis. */
async function syncAllPlatforms(userId) {
    const profiles = await cp_model_1.CompetitiveProfile.find({ userId: new mongoose_1.Types.ObjectId(userId) });
    const results = await Promise.allSettled(profiles.map((p) => syncPlatform(userId, p.platform)));
    return results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);
}
async function getAllProfiles(userId) {
    return cp_model_1.CompetitiveProfile.find({ userId: new mongoose_1.Types.ObjectId(userId) });
}
//# sourceMappingURL=cp.service.js.map