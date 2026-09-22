"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analysis = void 0;
const mongoose_1 = require("mongoose");
const analysisSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true },
    inputsSnapshot: {
        resumeId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Resume', default: null },
        githubProfileId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'GitHubProfile', default: null },
        competitiveProfileIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'CompetitiveProfile' }],
    },
    scores: {
        resumeScore: { type: Number, required: true },
        githubScore: { type: Number, required: true },
        codingScore: { type: Number, required: true },
        skillMatchScore: { type: Number, required: true },
        atsScore: { type: Number, required: true },
        careerScore: { type: Number, required: true },
    },
    weightsUsed: {
        resume: Number,
        github: Number,
        coding: Number,
        skillMatch: Number,
        ats: Number,
    },
    skillMatch: {
        requiredSkills: [String],
        matchedSkills: [String],
        missingSkills: [String],
    },
    aiInsightId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'AIInsight', default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });
analysisSchema.index({ userId: 1, createdAt: -1 });
exports.Analysis = (0, mongoose_1.model)('Analysis', analysisSchema);
//# sourceMappingURL=analysis.model.js.map