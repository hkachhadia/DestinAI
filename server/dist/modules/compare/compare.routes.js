"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const ApiResponse_1 = require("../../utils/ApiResponse");
const compare_service_1 = require("./compare.service");
async function getComparison(req, res) {
    const { baseId, compareId } = req.query;
    const result = await (0, compare_service_1.compareAnalyses)(req.user.id, baseId, compareId);
    return res.json((0, ApiResponse_1.ok)(req, result));
}
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
const querySchema = zod_1.z.object({
    baseId: zod_1.z.string().min(1, 'baseId is required'),
    compareId: zod_1.z.string().min(1, 'compareId is required'),
});
router.get('/', (0, validate_middleware_1.validate)(querySchema, 'query'), (0, asyncHandler_1.asyncHandler)(getComparison));
exports.default = router;
//# sourceMappingURL=compare.routes.js.map