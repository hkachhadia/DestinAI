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
exports.run = run;
exports.getLatest = getLatest;
exports.getOne = getOne;
const analysis_service_1 = require("./analysis.service");
const ApiResponse_1 = require("../../utils/ApiResponse");
async function run(req, res) {
    const { targetRole, 
    // Platform handles (CHANGE 1: all now accepted)
    githubUsername, leetcodeUsername, codeforcesHandle, codechefUsername, gfgUsername, hackerrankUsername, 
    // Supplemental
    linkedinUrl, portfolioUrl, kaggleUsername, mediumUsername, devtoUsername, } = req.body;
    // forceSync=true ensures GitHub/CP data is always refreshed on re-analysis
    // even if it was synced recently (within the 1-hour stale threshold)
    const analysis = await (0, analysis_service_1.runAnalysis)(req.user.id, {
        forceSync: true,
        targetRole,
        githubUsername,
        leetcodeUsername,
        codeforcesHandle,
        codechefUsername,
        gfgUsername,
        hackerrankUsername,
        linkedinUrl,
        portfolioUrl,
        kaggleUsername,
        mediumUsername,
        devtoUsername,
    });
    return res.status(201).json((0, ApiResponse_1.ok)(req, analysis));
}
async function getLatest(req, res) {
    const { getLatestAnalysis } = await Promise.resolve().then(() => __importStar(require('./analysis.service')));
    const analysis = await getLatestAnalysis(req.user.id);
    return res.json({ success: true, data: analysis, message: analysis ? 'OK' : 'No analysis yet', error: null });
}
async function getOne(req, res) {
    const { getAnalysisById } = await Promise.resolve().then(() => __importStar(require('./analysis.service')));
    const analysis = await getAnalysisById(req.user.id, req.params.id);
    return res.json({ success: true, data: analysis, message: 'OK', error: null });
}
//# sourceMappingURL=analysis.controller.js.map