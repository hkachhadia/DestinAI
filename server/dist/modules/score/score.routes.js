"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const dashboard_service_1 = require("../dashboard/dashboard.service");
const history_service_1 = require("../history/history.service");
const compare_service_1 = require("../compare/compare.service");
const ApiError_1 = require("../../utils/ApiError");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
/**
 * GET /score/overview
 * Powers: Dashboard score rings + Analytics charts + AI recommendation card.
 * Delegates to dashboard.service which aggregates Analysis + GitHub + CP data.
 */
router.get('/overview', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = await (0, dashboard_service_1.getDashboard)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, payload));
}));
/**
 * GET /score/history?page=1&limit=20
 * Powers: HistoryPage — paginated list of past analysis sessions.
 */
router.get('/history', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const raw = await (0, history_service_1.listHistory)(req.user.id, page, limit);
    // Shape to match the frontend HistoryListResponse type
    const entries = raw.entries.map((a) => ({
        id: String(a._id),
        title: a.targetRole ?? 'Career Analysis',
        date: a.createdAt.toISOString(),
        score: a.scores.careerScore,
        icon: 'auto_graph',
    }));
    return res.json((0, ApiResponse_1.ok)(req, { entries, total: raw.total }));
}));
/**
 * GET /score/comparison?baseId=&compareId=
 * Powers: ComparisonPage — side-by-side diff of two analysis snapshots.
 */
router.get('/comparison', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { baseId, compareId } = req.query;
    if (!baseId || !compareId) {
        throw new ApiError_1.ApiError(400, 'baseId and compareId query params are required', ApiError_1.ErrorCodes.VALIDATION_ERROR);
    }
    const result = await (0, compare_service_1.compareAnalyses)(req.user.id, baseId, compareId);
    // Shape to match frontend ComparisonResult type
    const shaped = {
        base: {
            id: String(result.base._id),
            label: `Earlier Scan — ${new Date(result.base.createdAt).toLocaleDateString()}`,
            roleTitle: result.base.targetRole ?? 'Career Analysis',
            focusArea: (result.base.skillMatch?.matchedSkills ?? []).slice(0, 2).join(', ') || 'General',
            score: result.base.scores.careerScore,
            scores: result.base.scores,
            skillMatch: result.base.skillMatch,
            date: result.base.createdAt.toISOString(),
        },
        compare: {
            id: String(result.compare._id),
            label: `Latest Scan — ${new Date(result.compare.createdAt).toLocaleDateString()}`,
            roleTitle: result.compare.targetRole ?? 'Career Analysis',
            focusArea: (result.compare.skillMatch?.matchedSkills ?? []).slice(0, 2).join(', ') || 'General',
            score: result.compare.scores.careerScore,
            scores: result.compare.scores,
            skillMatch: result.compare.skillMatch,
            date: result.compare.createdAt.toISOString(),
        },
        deltaPercent: result.deltaPercent,
        scoreDeltas: result.scoreDeltas,
        newlyMatchedSkills: result.newlyMatchedSkills,
        skillsLost: result.skillsLost ?? [],
        stillMissingSkills: result.stillMissingSkills,
        improvedSkillCount: result.improvedSkillCount ?? 0,
        insight: result.insight,
    };
    return res.json((0, ApiResponse_1.ok)(req, shaped));
}));
/**
 * POST /score/recompute
 * Forces a fresh scoring-engine run (used after new resume/GitHub/CP sync).
 */
router.post('/recompute', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { runAnalysis } = await Promise.resolve().then(() => __importStar(require('../analysis/analysis.service')));
    await runAnalysis(req.user.id, { skipAIReport: true });
    const payload = await (0, dashboard_service_1.getDashboard)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, payload));
}));
exports.default = router;
//# sourceMappingURL=score.routes.js.map