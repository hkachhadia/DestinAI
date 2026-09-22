"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInsight = void 0;
const mongoose_1 = require("mongoose");
const confidenceSchema = new mongoose_1.Schema({
    recommendation: String,
    confidence: { type: Number, min: 0, max: 100, default: 75 },
    confidenceLabel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    reason: String,
}, { _id: false });
const aiInsightSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    analysisId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    targetRole: { type: String, required: true },
    report: {
        executiveSummary: { type: String, default: '' },
        strengths: [{ title: String, description: String }],
        weaknesses: [{ title: String, description: String }],
        missingSkills: [String],
        missingTechnologies: [String],
        recommendedProjects: [{ title: String, category: String, description: String }],
        learningRoadmap: [{
                phase: String, title: String, description: String, tags: [String],
            }],
        interviewQuestions: [{
                category: String, question: String, difficulty: String, sampleApproach: String,
            }],
        certifications: { type: [String], default: [] },
        careerAdvice: { type: String, default: '' },
        plan30Day: { type: [String], default: [] },
        plan60Day: { type: [String], default: [] },
        plan90Day: { type: [String], default: [] },
        interviewReadiness: { type: Number, default: 50 },
        industryReadiness: { type: Number, default: 50 },
        recommendationConfidence: { type: [confidenceSchema], default: [] },
    },
    rawModelResponse: { type: String, select: false },
}, { timestamps: { createdAt: true, updatedAt: false } });
aiInsightSchema.index({ userId: 1, analysisId: 1 }, { unique: true });
exports.AIInsight = (0, mongoose_1.model)('AIInsight', aiInsightSchema);
//# sourceMappingURL=aiInsight.model.js.map