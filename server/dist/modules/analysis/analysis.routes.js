"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const analysisController = __importStar(require("./analysis.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Accept all platform handles — empty string treated as "no change" in service layer
const runSchema = zod_1.z.object({
    targetRole: zod_1.z.string().min(1).max(120).optional(),
    // Coding platform handles
    githubUsername: zod_1.z.string().max(39).optional(),
    leetcodeUsername: zod_1.z.string().max(50).optional(),
    codeforcesHandle: zod_1.z.string().max(50).optional(),
    codechefUsername: zod_1.z.string().max(50).optional(),
    gfgUsername: zod_1.z.string().max(50).optional(),
    hackerrankUsername: zod_1.z.string().max(50).optional(),
    // Supplemental fields
    linkedinUrl: zod_1.z.string().max(500).optional(),
    portfolioUrl: zod_1.z.string().max(500).optional(),
    kaggleUsername: zod_1.z.string().max(50).optional(),
    mediumUsername: zod_1.z.string().max(50).optional(),
    devtoUsername: zod_1.z.string().max(50).optional(),
});
router.post('/', (0, validate_middleware_1.validate)(runSchema), (0, asyncHandler_1.asyncHandler)(analysisController.run));
router.get('/latest', (0, asyncHandler_1.asyncHandler)(analysisController.getLatest));
router.get('/:id', (0, asyncHandler_1.asyncHandler)(analysisController.getOne));
exports.default = router;
//# sourceMappingURL=analysis.routes.js.map