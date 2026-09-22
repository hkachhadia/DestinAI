"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const dashboard_service_1 = require("./dashboard.service");
async function getDashboardHandler(req, res) {
    const payload = await (0, dashboard_service_1.getDashboard)(req.user.id);
    return res.json((0, ApiResponse_1.ok)(req, payload));
}
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', (0, asyncHandler_1.asyncHandler)(getDashboardHandler));
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map