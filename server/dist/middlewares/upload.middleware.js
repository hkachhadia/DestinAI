"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadResumeToDisk = exports.uploadResume = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const ApiError_1 = require("../utils/ApiError");
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new ApiError_1.ApiError(415, 'Only PDF and DOCX files are allowed', 'UNSUPPORTED_FILE_TYPE'));
    }
};
// Memory storage — buffer is used by server-2's resume parsing pipeline
exports.uploadResume = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_1.env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter,
}).single('resume');
// Disk storage option (used if you want to save to uploads/ dir)
exports.uploadResumeToDisk = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (_req, _file, cb) => cb(null, env_1.env.RESUME_UPLOAD_DIR),
        filename: (_req, file, cb) => {
            const ext = path_1.default.extname(file.originalname);
            cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        },
    }),
    limits: { fileSize: env_1.env.RESUME_MAX_FILE_SIZE_MB * 1024 * 1024 },
    fileFilter,
}).single('resume');
//# sourceMappingURL=upload.middleware.js.map