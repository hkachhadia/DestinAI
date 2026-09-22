"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
exports.ok = ok;
exports.fail = fail;
// Merged unified response helpers
// Server-1 style: class methods
class ApiResponse {
    static ok(res, data, message = 'Success') {
        return res.status(200).json({ success: true, data, message, error: null });
    }
    static created(res, data, message = 'Created') {
        return res.status(201).json({ success: true, data, message, error: null });
    }
}
exports.ApiResponse = ApiResponse;
// Server-2 style: functional helpers (ok(req, data) => plain object)
function ok(req, data) {
    void req; // req kept for signature compatibility with server-2 callers
    return { success: true, data, error: null };
}
function fail(req, code, message) {
    void req;
    return { success: false, data: null, error: { code, message } };
}
//# sourceMappingURL=ApiResponse.js.map