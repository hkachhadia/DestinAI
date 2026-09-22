import multer from 'multer';
import path from 'path';
import { env } from '@config/env';
import { ApiError } from '@utils/ApiError';
import type { Request } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(415, 'Only PDF and DOCX files are allowed', 'UNSUPPORTED_FILE_TYPE'));
  }
};

// Memory storage — buffer is used by server-2's resume parsing pipeline
export const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
}).single('resume');

// Disk storage option (used if you want to save to uploads/ dir)
export const uploadResumeToDisk = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, env.RESUME_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
}).single('resume');
