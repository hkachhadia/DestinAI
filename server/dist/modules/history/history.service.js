"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listHistory = listHistory;
const mongoose_1 = require("mongoose");
const analysis_model_1 = require("../analysis/analysis.model");
async function listHistory(userId, page = 1, limit = 20) {
    const filter = { userId: new mongoose_1.Types.ObjectId(userId) };
    const [entries, total] = await Promise.all([
        analysis_model_1.Analysis.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        analysis_model_1.Analysis.countDocuments(filter),
    ]);
    return { entries, total, page, limit };
}
//# sourceMappingURL=history.service.js.map