"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitiveProfile = exports.CP_PLATFORMS = void 0;
const mongoose_1 = require("mongoose");
exports.CP_PLATFORMS = ['leetcode', 'codeforces', 'codechef', 'gfg', 'hackerrank'];
const competitiveProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: exports.CP_PLATFORMS, required: true },
    handle: { type: String, required: true },
    stats: {
        rating: { type: Number, default: 0 },
        maxRating: { type: Number, default: 0 },
        rank: { type: String, default: '' },
        problemsSolved: {
            easy: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            hard: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
        },
        contestsAttended: { type: Number, default: 0 },
        badges: [String],
    },
    lastSyncedAt: { type: Date, default: Date.now },
    lastSyncError: String,
}, { timestamps: true });
competitiveProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });
exports.CompetitiveProfile = (0, mongoose_1.model)('CompetitiveProfile', competitiveProfileSchema);
//# sourceMappingURL=cp.model.js.map