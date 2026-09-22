"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubProfile = void 0;
const mongoose_1 = require("mongoose");
const githubProfileSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    username: { type: String, required: true },
    stats: {
        publicRepos: { type: Number, default: 0 },
        followers: { type: Number, default: 0 },
        totalStars: { type: Number, default: 0 },
        totalCommitsLastYear: { type: Number, default: 0 },
        topLanguages: [{ language: String, percentage: Number }],
        pinnedRepos: [{ name: String, description: String, stars: Number, language: String, url: String }],
        accountCreatedAt: String,
    },
    lastSyncedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.GitHubProfile = (0, mongoose_1.model)('GitHubProfile', githubProfileSchema);
//# sourceMappingURL=github.model.js.map