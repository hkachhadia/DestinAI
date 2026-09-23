"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAnalysis = runAnalysis;
exports.getAnalysisById = getAnalysisById;
exports.getLatestAnalysis = getLatestAnalysis;
exports.deleteAnalysis = deleteAnalysis;
exports.deleteAllAnalyses = deleteAllAnalyses;
const logger_1 = require("../../config/logger");
const mongoose_1 = require("mongoose");
const analysis_model_1 = require("./analysis.model");
const resume_service_1 = require("../resume/resume.service");
const github_service_1 = require("../github/github.service");
const cp_service_1 = require("../competitiveProgramming/cp.service");
const scoring_service_1 = require("../scoring/scoring.service");
const ApiError_1 = require("../../utils/ApiError");
const user_model_1 = require("../user/user.model");
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
function isStale(lastSyncedAt, force = false) {
    if (force)
        return true;
    if (!lastSyncedAt)
        return true;
    return (Date.now() - new Date(lastSyncedAt).getTime() >
        STALE_THRESHOLD_MS);
}
/**
 * If new handles are provided in options, connect/update them first.
 * Then auto-sync any stale existing profiles.
 *
 * This ensures re-analysis always uses the freshest possible data,
 * including new usernames entered in the modal.
 */
async function prepareProfiles(userId, options) {
    const jobs = [];
    // ── Step 1: Connect or update provided handles ──────────────────────────
    if (options.githubUsername) {
        jobs.push((0, github_service_1.connectGitHub)(userId, options.githubUsername).catch((err) => logger_1.logger.warn(`[REANALYSIS] GitHub connect failed: ${err.message}`)));
    }
    const cpUpdates = [];
    if (options.leetcodeUsername) {
        cpUpdates.push({
            platform: 'leetcode',
            handle: options.leetcodeUsername,
        });
    }
    if (options.codeforcesHandle) {
        cpUpdates.push({
            platform: 'codeforces',
            handle: options.codeforcesHandle,
        });
    }
    if (options.codechefUsername) {
        cpUpdates.push({
            platform: 'codechef',
            handle: options.codechefUsername,
        });
    }
    if (options.gfgUsername) {
        cpUpdates.push({
            platform: 'gfg',
            handle: options.gfgUsername,
        });
    }
    if (options.hackerrankUsername) {
        cpUpdates.push({
            platform: 'hackerrank',
            handle: options.hackerrankUsername,
        });
    }
    for (const cp of cpUpdates) {
        jobs.push((0, cp_service_1.connectPlatform)(userId, cp.platform, cp.handle).catch((err) => logger_1.logger.warn(`[REANALYSIS] ${cp.platform} connect failed: ${err.message}`)));
    }
    // Save supplemental profile fields
    const supplemental = {};
    if (options.linkedinUrl) {
        supplemental.linkedinUrl = options.linkedinUrl;
    }
    if (options.portfolioUrl) {
        supplemental.portfolioUrl = options.portfolioUrl;
    }
    if (options.kaggleUsername) {
        supplemental.kaggleUsername = options.kaggleUsername;
    }
    if (options.mediumUsername) {
        supplemental.mediumUsername = options.mediumUsername;
    }
    if (options.devtoUsername) {
        supplemental.devtoUsername = options.devtoUsername;
    }
    if (Object.keys(supplemental).length > 0) {
        jobs.push(user_model_1.User.findByIdAndUpdate(userId, {
            $set: supplemental,
        }).catch((err) => logger_1.logger.warn(`[REANALYSIS] Supplemental profile update failed: ${err.message}`)));
    }
    // Execute all connection jobs in parallel
    if (jobs.length > 0) {
        await Promise.allSettled(jobs);
    }
    // ── Step 2: Auto-sync stale existing profiles ───────────────────────────
    const [github, cpProfiles] = await Promise.all([
        (0, github_service_1.getGitHubProfile)(userId),
        (0, cp_service_1.getAllProfiles)(userId),
    ]);
    const syncJobs = [];
    const forceSync = options.forceSync ?? false;
    if (github && isStale(github.lastSyncedAt, forceSync)) {
        syncJobs.push((0, github_service_1.syncGitHubProfile)(userId).catch((err) => logger_1.logger.warn(`[AUTO_SYNC] GitHub sync failed: ${err.message}`)));
    }
    for (const profile of cpProfiles) {
        if (isStale(profile.lastSyncedAt, forceSync)) {
            syncJobs.push((0, cp_service_1.syncPlatform)(userId, profile.platform).catch((err) => logger_1.logger.warn(`[AUTO_SYNC] ${profile.platform} sync failed: ${err.message}`)));
        }
    }
    if (syncJobs.length > 0) {
        logger_1.logger.info(`[AUTO_SYNC] Syncing ${syncJobs.length} stale profile(s) for user ${userId}`);
        await Promise.allSettled(syncJobs);
    }
}
async function runAnalysis(userId, options = {}) {
    // Step 1: Connect new handles + sync stale profiles
    await prepareProfiles(userId, options);
    // Step 2: Read fresh profile data
    const [user, resume, github, competitiveProfiles] = await Promise.all([
        user_model_1.User.findById(userId),
        (0, resume_service_1.getLatestResume)(userId),
        (0, github_service_1.getGitHubProfile)(userId),
        (0, cp_service_1.getAllProfiles)(userId),
    ]);
    if (!resume && !github && competitiveProfiles.length === 0) {
        throw new ApiError_1.ApiError(422, 'Please connect at least one data source: upload a resume, link your GitHub, or connect a coding platform (LeetCode, Codeforces, etc.) before running analysis.', ApiError_1.ErrorCodes.ANALYSIS_PREREQUISITES_MISSING);
    }
    const targetRole = options.targetRole ??
        user?.targetRole ??
        'Software Engineer';
    // Step 3: Compute deterministic scores
    const { breakdown, weightsUsed, skillMatch } = (0, scoring_service_1.computeScores)({
        resume,
        github,
        competitiveProfiles,
        targetRole,
    });
    // Step 4: Persist analysis — always creates a NEW document
    const analysis = await analysis_model_1.Analysis.create({
        userId: new mongoose_1.Types.ObjectId(userId),
        targetRole,
        inputsSnapshot: {
            resumeId: resume?._id ?? null,
            githubProfileId: github?._id ?? null,
            competitiveProfileIds: competitiveProfiles.map((p) => p._id),
        },
        scores: breakdown,
        weightsUsed,
        skillMatch,
        // AI will be generated separately after the analysis response.
        aiInsightId: null,
    });
    /**
     * IMPORTANT:
     *
     * Gemini AI generation intentionally does NOT happen here anymore.
     *
     * runAnalysis() now finishes as soon as the deterministic analysis
     * has been calculated and persisted.
     *
     * The AI report will be generated separately using the analysis ID.
     *
     * This prevents the POST /analysis request from waiting for Gemini.
     */
    logger_1.logger.info('[ANALYSIS] Deterministic analysis completed', {
        userId,
        analysisId: String(analysis._id),
        targetRole,
        resumeConnected: !!resume,
        githubConnected: !!github,
        cpCount: competitiveProfiles.length,
        careerScore: breakdown.careerScore,
    });
    return analysis;
}
async function getAnalysisById(userId, analysisId) {
    const analysis = await analysis_model_1.Analysis.findOne({
        _id: analysisId,
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!analysis) {
        throw new ApiError_1.ApiError(404, 'Analysis not found', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    return analysis;
}
async function getLatestAnalysis(userId) {
    return analysis_model_1.Analysis.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
}
async function deleteAnalysis(userId, analysisId) {
    const analysis = await analysis_model_1.Analysis.findOne({
        _id: analysisId,
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!analysis) {
        throw new ApiError_1.ApiError(404, 'Analysis not found', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    await analysis.deleteOne();
}
async function deleteAllAnalyses(userId) {
    const result = await analysis_model_1.Analysis.deleteMany({
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    return {
        deletedCount: result.deletedCount,
    };
}
//# sourceMappingURL=analysis.service.js.map