"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/user/user.routes"));
const resume_routes_1 = __importDefault(require("../modules/resume/resume.routes"));
const github_routes_1 = __importDefault(require("../modules/github/github.routes"));
const cp_routes_1 = __importDefault(require("../modules/competitiveProgramming/cp.routes"));
const analysis_routes_1 = __importDefault(require("../modules/analysis/analysis.routes"));
const ai_routes_1 = __importDefault(require("../modules/ai/ai.routes"));
const score_routes_1 = __importDefault(require("../modules/score/score.routes"));
const dashboard_routes_1 = __importDefault(require("../modules/dashboard/dashboard.routes"));
const history_routes_1 = __importDefault(require("../modules/history/history.routes"));
const compare_routes_1 = __importDefault(require("../modules/compare/compare.routes"));
const router = (0, express_1.Router)();
// Health check
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'DestinAI API is healthy',
        data: { timestamp: new Date().toISOString(), version: '1.0.0' },
    });
});
// Phase 1
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/resumes', resume_routes_1.default);
// Phase 2
router.use('/github', github_routes_1.default);
router.use('/cp', cp_routes_1.default);
router.use('/analysis', analysis_routes_1.default);
router.use('/ai', ai_routes_1.default);
router.use('/score', score_routes_1.default);
router.use('/dashboard', dashboard_routes_1.default);
router.use('/history', history_routes_1.default);
router.use('/compare', compare_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map