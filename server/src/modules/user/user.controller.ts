import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { userService } from './user.service';
import { toPublicUser } from '@modules/auth/auth.types';

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.getById(req.user.userId);
    return ApiResponse.ok(res, toPublicUser(user), 'Profile fetched');
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const user = await userService.updateProfile(req.user.userId, req.body);
    return ApiResponse.ok(res, toPublicUser(user), 'Profile updated');
  }),

  deleteMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    await userService.deleteAccount(req.user.userId);
    return ApiResponse.ok(res, null, 'Account deleted');
  }),

  getSettings: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const settings = await userService.getSettings(req.user.userId);
    return ApiResponse.ok(res, settings, 'Settings fetched');
  }),

  updateSettings: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const settings = await userService.updateSettings(req.user.userId, req.body);
    return ApiResponse.ok(res, settings, 'Settings updated');
  }),
};
