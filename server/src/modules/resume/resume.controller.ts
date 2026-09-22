import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';
import { ApiResponse } from '@utils/ApiResponse';
import { ApiError } from '@utils/ApiError';
import { uploadAndParseResume, getLatestResume, getResumeById } from './resume.service';

export const resumeController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.file) throw ApiError.badRequest("No file uploaded. Field name must be 'resume'.");

    const resume = await uploadAndParseResume({
      userId: req.user.userId,
      originalFilename: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });

    return ApiResponse.created(res, resume, 'Resume uploaded and parsed');
  }),

  getMine: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const resume = await getLatestResume(req.user.userId);
    return ApiResponse.ok(res, resume, 'Latest resume fetched');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const resume = await getResumeById(req.user.userId, req.params.id);
    return ApiResponse.ok(res, resume, 'Resume fetched');
  }),
};
