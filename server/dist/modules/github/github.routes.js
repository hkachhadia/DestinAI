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
const githubController = __importStar(require("./github.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const connectSchema = zod_1.z.object({
    username: zod_1.z.string().min(1, 'GitHub username is required').max(39),
});
router.post('/connect', (0, validate_middleware_1.validate)(connectSchema), (0, asyncHandler_1.asyncHandler)(githubController.connect));
router.post('/sync', (0, asyncHandler_1.asyncHandler)(githubController.sync));
router.get('/profile', (0, asyncHandler_1.asyncHandler)(githubController.getProfile));
exports.default = router;
//# sourceMappingURL=github.routes.js.map