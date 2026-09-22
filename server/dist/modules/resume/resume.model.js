"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeModel = exports.Resume = void 0;
const mongoose_1 = require("mongoose");
const resumeSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
        type: String,
        enum: ['uploaded', 'parsing', 'parsed', 'failed'],
        default: 'uploaded',
    },
    parsedData: {
        type: new mongoose_1.Schema({
            fullName: String, email: String, phone: String, links: [String],
            education: [{ institution: String, degree: String, year: String, gpa: String }],
            experience: [{ company: String, title: String, startDate: String, endDate: String, bullets: [String], description: String }],
            projects: [{ name: String, description: String, techStack: [String], tech: [String] }],
            skills: [String],
            certifications: [String],
        }, { _id: false }),
        default: undefined,
    },
    atsFindings: {
        type: new mongoose_1.Schema({ score: Number, missing: [String], suggestions: [String] }, { _id: false }),
        default: undefined,
    },
    rawText: { type: String, select: false },
    failureReason: String,
}, { timestamps: true });
resumeSchema.index({ userId: 1, createdAt: -1 });
exports.Resume = (0, mongoose_1.model)('Resume', resumeSchema);
// Legacy alias used by server-1 imports
exports.ResumeModel = exports.Resume;
//# sourceMappingURL=resume.model.js.map