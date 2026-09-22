"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).max(120).optional(),
    college: zod_1.z.string().trim().max(200).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    experienceLevel: zod_1.z.enum(["0-1", "1-3", "3-5", "5-8", "8+"]).optional(),
    targetRole: zod_1.z.string().trim().max(120).optional(),
    targetCompanies: zod_1.z.array(zod_1.z.string().trim().min(1)).max(20).optional(),
})
    .strict();
//# sourceMappingURL=user.validation.js.map