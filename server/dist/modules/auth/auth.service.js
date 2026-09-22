"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const user_model_1 = require("../user/user.model");
const hash_util_1 = require("../../utils/hash.util");
const jwt_util_1 = require("../../utils/jwt.util");
const ApiError_1 = require("../../utils/ApiError");
const auth_types_1 = require("./auth.types");
async function issueTokens(userId, email, tokenVersion) {
    const accessToken = jwt_util_1.jwtUtil.signAccessToken({ sub: userId, email });
    const refreshToken = jwt_util_1.jwtUtil.signRefreshToken({ sub: userId, tokenVersion });
    const refreshTokenHash = await hash_util_1.hashUtil.hash(refreshToken);
    await user_model_1.UserModel.findByIdAndUpdate(userId, { refreshTokenHash });
    return { accessToken, refreshToken };
}
exports.authService = {
    async signup(input) {
        const existing = await user_model_1.UserModel.findOne({ email: input.email });
        if (existing) {
            throw ApiError_1.ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");
        }
        const passwordHash = await hash_util_1.hashUtil.hash(input.password);
        const user = await user_model_1.UserModel.create({
            name: input.name,
            email: input.email,
            passwordHash,
            authProvider: "local",
        });
        const { accessToken, refreshToken } = await issueTokens(user._id.toString(), user.email, user.tokenVersion);
        return { user: (0, auth_types_1.toPublicUser)(user), accessToken, refreshToken };
    },
    async login(input) {
        const user = await user_model_1.UserModel.findOne({ email: input.email }).select("+passwordHash");
        if (!user || !user.passwordHash) {
            throw ApiError_1.ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
        }
        const isMatch = await hash_util_1.hashUtil.compare(input.password, user.passwordHash);
        if (!isMatch) {
            throw ApiError_1.ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
        }
        user.lastLoginAt = new Date();
        await user.save();
        const { accessToken, refreshToken } = await issueTokens(user._id.toString(), user.email, user.tokenVersion);
        return { user: (0, auth_types_1.toPublicUser)(user), accessToken, refreshToken };
    },
    async refresh(refreshToken) {
        let payload;
        try {
            payload = jwt_util_1.jwtUtil.verifyRefreshToken(refreshToken);
        }
        catch {
            throw ApiError_1.ApiError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
        }
        const user = await user_model_1.UserModel.findById(payload.sub).select("+refreshTokenHash");
        if (!user || !user.refreshTokenHash) {
            throw ApiError_1.ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
        }
        if (payload.tokenVersion !== user.tokenVersion) {
            throw ApiError_1.ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
        }
        const isMatch = await hash_util_1.hashUtil.compare(refreshToken, user.refreshTokenHash);
        if (!isMatch) {
            throw ApiError_1.ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
        }
        // Rotate: issue a brand new refresh token and invalidate the old one.
        const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user._id.toString(), user.email, user.tokenVersion);
        return { user: (0, auth_types_1.toPublicUser)(user), accessToken, refreshToken: newRefreshToken };
    },
    async logout(userId) {
        // Bumping tokenVersion invalidates every outstanding refresh token for
        // this user (e.g. other devices) in addition to clearing the stored hash.
        await user_model_1.UserModel.findByIdAndUpdate(userId, {
            $unset: { refreshTokenHash: 1 },
            $inc: { tokenVersion: 1 },
        });
    },
};
//# sourceMappingURL=auth.service.js.map