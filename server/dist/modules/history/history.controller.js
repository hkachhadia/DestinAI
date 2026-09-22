"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistory = getHistory;
const ApiResponse_1 = require("../../utils/ApiResponse");
const history_service_1 = require("./history.service");
async function getHistory(req, res) {
    const page = Number(req.query.page ?? 1) || 1;
    const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
    const result = await (0, history_service_1.listHistory)(req.user.id, page, limit);
    return res.json((0, ApiResponse_1.ok)(req, result));
}
//# sourceMappingURL=history.controller.js.map