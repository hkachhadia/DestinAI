"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPublicUser = toPublicUser;
function toPublicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        authProvider: user.authProvider,
        avatarUrl: user.avatarUrl,
        role: user.role,
        plan: user.plan,
        college: user.college,
        location: user.location,
        experienceLevel: user.experienceLevel,
        targetRole: user.targetRole,
        targetCompanies: user.targetCompanies,
        isOnboarded: user.isOnboarded,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
    };
}
//# sourceMappingURL=auth.types.js.map