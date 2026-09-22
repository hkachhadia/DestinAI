"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, select: false },
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    avatarUrl: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    college: String,
    location: String,
    experienceLevel: { type: String, enum: ['0-1', '1-3', '3-5', '5-8', '8+'] },
    targetRole: String,
    targetCompanies: { type: [String], default: [] },
    bio: String,
    isOnboarded: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    settings: {
        notifications: {
            weeklyDigest: { type: Boolean, default: true },
            scoreAlerts: { type: Boolean, default: true },
            productUpdates: { type: Boolean, default: false },
        },
        theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    },
    // Virtual mirror for server-2 compatibility
    profile: {
        avatarUrl: String,
        headline: String,
        targetRole: String,
    },
    lastLoginAt: Date,
}, { timestamps: true });
// Keep profile.targetRole in sync with top-level targetRole
userSchema.pre('save', function (next) {
    if (this.isModified('targetRole')) {
        this.profile = { ...this.profile, targetRole: this.targetRole };
    }
    next();
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
// Alias for server-2 compatibility
exports.User = exports.UserModel;
//# sourceMappingURL=user.model.js.map