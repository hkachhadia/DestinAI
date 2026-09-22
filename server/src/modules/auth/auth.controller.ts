import { Request, Response } from "express";
import { asyncHandler } from "@utils/asyncHandler";
import { ApiResponse } from "@utils/ApiResponse";
import { ApiError } from "@utils/ApiError";
import { authService } from "./auth.service";
import { UserModel } from "@modules/user/user.model";
import { toPublicUser } from "./auth.types";

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.signup(req.body);
    return ApiResponse.created(res, result, "Account created successfully");
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);
    return ApiResponse.ok(res, result, "Logged in successfully");
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req.body.refreshToken);
    return ApiResponse.ok(res, result, "Token refreshed successfully");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await authService.logout(req.user.userId);
    return ApiResponse.ok(res, null, "Logged out successfully");
  }),

  /** GET /auth/me — also exposed as GET /users/me by the user module. */
  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await UserModel.findById(req.user.userId);
    if (!user) throw ApiError.notFound("User not found");
    return ApiResponse.ok(res, toPublicUser(user), "Current user fetched");
  }),
};
