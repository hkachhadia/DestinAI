"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromDocx = extractTextFromDocx;
const mammoth_1 = __importDefault(require("mammoth"));
async function extractTextFromDocx(buffer) {
    const result = await mammoth_1.default.extractRawText({ buffer });
    return result.value;
}
//# sourceMappingURL=docxExtractor.js.map