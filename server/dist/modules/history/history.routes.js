"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const ApiResponse_1 = require("../../utils/ApiResponse");
const history_controller_1 = require("./history.controller");
const analysis_service_1 = require("../analysis/analysis.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// GET /history — paginated list
router.get('/', (0, asyncHandler_1.asyncHandler)(history_controller_1.getHistory));
// DELETE /history/all — delete every history entry for this user
router.delete('/all', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, analysis_service_1.deleteAllAnalyses)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, result));
}));
// DELETE /history/batch — delete multiple entries by IDs
const batchDeleteSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one ID is required'),
});
router.delete('/batch', (0, validate_middleware_1.validate)(batchDeleteSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { ids } = req.body;
    const results = await Promise.allSettled(ids.map((id) => (0, analysis_service_1.deleteAnalysis)(req.user.id, id)));
    const deleted = results.filter((r) => r.status === 'fulfilled').length;
    return res.json((0, ApiResponse_1.ok)(req, { deleted, total: ids.length }));
}));
// DELETE /history/:id — delete a single entry
router.delete('/:id', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, analysis_service_1.deleteAnalysis)(req.user.id, req.params.id);
    return res.json((0, ApiResponse_1.ok)(req, { deleted: 1 }));
}));
exports.default = router;
//# sourceMappingURL=history.routes.js.map