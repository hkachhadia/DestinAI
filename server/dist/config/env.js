"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    API_PREFIX: zod_1.z.string().default('/api/v1'),
    CORS_ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:5173'),
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('30d'),
    BCRYPT_SALT_ROUNDS: zod_1.z.coerce.number().default(10),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(100),
    AUTH_RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(20),
    RESUME_UPLOAD_DIR: zod_1.z.string().default('uploads/resumes'),
    RESUME_MAX_FILE_SIZE_MB: zod_1.z.coerce.number().default(5),
    LOG_LEVEL: zod_1.z.string().default('info'),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    GEMINI_MODEL: zod_1.z.string().default('gemini-3.8-flash'),
    GITHUB_API_TOKEN: zod_1.z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:\n', parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    CORS_ALLOWED_ORIGINS: parsed.data.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    IS_PRODUCTION: parsed.data.NODE_ENV === 'production',
};
//# sourceMappingURL=env.js.map