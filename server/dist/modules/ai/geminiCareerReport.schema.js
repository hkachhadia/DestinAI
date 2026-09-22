"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiCareerReportSchema = void 0;
const zod_1 = require("zod");
const strengthOrWeaknessSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string(),
});
const roadmapPhaseSchema = zod_1.z.object({
    phase: zod_1.z.string(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
const recommendedProjectSchema = zod_1.z.object({
    title: zod_1.z.string(),
    category: zod_1.z.string(),
    description: zod_1.z.string(),
});
const interviewQuestionSchema = zod_1.z.object({
    category: zod_1.z.string(),
    question: zod_1.z.string(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).default('medium'),
    sampleApproach: zod_1.z.string().default(''),
});
const recommendationConfidenceSchema = zod_1.z.object({
    recommendation: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(100),
    confidenceLabel: zod_1.z.enum(['Low', 'Medium', 'High']),
    reason: zod_1.z.string(),
});
exports.geminiCareerReportSchema = zod_1.z.object({
    executiveSummary: zod_1.z.string().default(''),
    strengths: zod_1.z.array(strengthOrWeaknessSchema).default([]),
    weaknesses: zod_1.z.array(strengthOrWeaknessSchema).default([]),
    missingSkills: zod_1.z.array(zod_1.z.string()).default([]),
    missingTechnologies: zod_1.z.array(zod_1.z.string()).default([]),
    recommendedProjects: zod_1.z.array(recommendedProjectSchema).default([]),
    learningRoadmap: zod_1.z.array(roadmapPhaseSchema).default([]),
    interviewQuestions: zod_1.z.array(interviewQuestionSchema).default([]),
    certifications: zod_1.z.array(zod_1.z.string()).default([]),
    careerAdvice: zod_1.z.string().default(''),
    plan30Day: zod_1.z.array(zod_1.z.string()).default([]),
    plan60Day: zod_1.z.array(zod_1.z.string()).default([]),
    plan90Day: zod_1.z.array(zod_1.z.string()).default([]),
    interviewReadiness: zod_1.z.number().min(0).max(100).default(50),
    industryReadiness: zod_1.z.number().min(0).max(100).default(50),
    recommendationConfidence: zod_1.z.array(recommendationConfidenceSchema).default([]),
});
//# sourceMappingURL=geminiCareerReport.schema.js.map