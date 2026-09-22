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
exports.userService = void 0;
const user_model_1 = require("./user.model");
const ApiError_1 = require("../../utils/ApiError");
exports.userService = {
    async getById(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        return user;
    },
    async updateProfile(userId, input) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        Object.assign(user, input);
        // Keep profile.targetRole in sync
        if (input.targetRole) {
            user.profile = { ...user.profile, targetRole: input.targetRole };
        }
        if (input.targetRole && !user.isOnboarded) {
            user.isOnboarded = true;
        }
        await user.save();
        return user;
    },
    async getSettings(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        return {
            ...user.settings,
            profile: {
                fullName: user.name,
                email: user.email,
                bio: user.bio ?? '',
                avatarUrl: user.avatarUrl,
                memberSince: user.createdAt.toISOString(),
            },
        };
    },
    async updateSettings(userId, patch) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        if (patch.profile?.fullName)
            user.name = patch.profile.fullName;
        if (patch.profile?.bio !== undefined)
            user.bio = patch.profile.bio;
        if (patch.notifications) {
            user.settings.notifications = { ...user.settings.notifications, ...patch.notifications };
        }
        if (patch.theme)
            user.settings.theme = patch.theme;
        await user.save();
        return user.settings;
    },
    async deleteAccount(userId) {
        const user = await user_model_1.UserModel.findById(userId);
        if (!user)
            throw ApiError_1.ApiError.notFound('User not found');
        // Cascade-delete all user data in parallel
        const { Types } = await Promise.resolve().then(() => __importStar(require('mongoose')));
        const uid = new Types.ObjectId(userId);
        const { Analysis } = await Promise.resolve().then(() => __importStar(require('../analysis/analysis.model')));
        const { AIInsight } = await Promise.resolve().then(() => __importStar(require('../ai/aiInsight.model')));
        const { Resume } = await Promise.resolve().then(() => __importStar(require('../resume/resume.model')));
        const { GitHubProfile } = await Promise.resolve().then(() => __importStar(require('../github/github.model')));
        const { CompetitiveProfile } = await Promise.resolve().then(() => __importStar(require('../competitiveProgramming/cp.model')));
        await Promise.allSettled([
            Analysis.deleteMany({ userId: uid }),
            AIInsight.deleteMany({ userId: uid }),
            Resume.deleteMany({ userId: uid }),
            GitHubProfile.deleteMany({ userId: uid }),
            CompetitiveProfile.deleteMany({ userId: uid }),
            user.deleteOne(),
        ]);
    },
};
//# sourceMappingURL=user.service.js.map