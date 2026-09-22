import { UserModel } from "@modules/user/user.model";
import { hashUtil } from "@utils/hash.util";
import { jwtUtil } from "@utils/jwt.util";
import { ApiError } from "@utils/ApiError";
import { AuthResult, toPublicUser } from "./auth.types";
import { LoginInput, SignupInput } from "./auth.validation";

async function issueTokens(userId: string, email: string, tokenVersion: number) {
  const accessToken = jwtUtil.signAccessToken({ sub: userId, email });
  const refreshToken = jwtUtil.signRefreshToken({ sub: userId, tokenVersion });
  const refreshTokenHash = await hashUtil.hash(refreshToken);
  await UserModel.findByIdAndUpdate(userId, { refreshTokenHash });
  return { accessToken, refreshToken };
}

export const authService = {
  async signup(input: SignupInput): Promise<AuthResult> {
    const existing = await UserModel.findOne({ email: input.email });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");
    }

    const passwordHash = await hashUtil.hash(input.password);
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
      authProvider: "local",
    });

    const { accessToken, refreshToken } = await issueTokens(
      user._id.toString(),
      user.email,
      user.tokenVersion
    );

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");
    if (!user || !user.passwordHash) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isMatch = await hashUtil.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = await issueTokens(
      user._id.toString(),
      user.email,
      user.tokenVersion
    );

    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = jwtUtil.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token", "REFRESH_TOKEN_INVALID");
    }

    const user = await UserModel.findById(payload.sub).select("+refreshTokenHash");
    if (!user || !user.refreshTokenHash) {
      throw ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      throw ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
    }

    const isMatch = await hashUtil.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw ApiError.unauthorized("Session no longer valid", "REFRESH_TOKEN_INVALID");
    }

    // Rotate: issue a brand new refresh token and invalidate the old one.
    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(
      user._id.toString(),
      user.email,
      user.tokenVersion
    );

    return { user: toPublicUser(user), accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string): Promise<void> {
    // Bumping tokenVersion invalidates every outstanding refresh token for
    // this user (e.g. other devices) in addition to clearing the stored hash.
    await UserModel.findByIdAndUpdate(userId, {
      $unset: { refreshTokenHash: 1 },
      $inc: { tokenVersion: 1 },
    });
  },
};
