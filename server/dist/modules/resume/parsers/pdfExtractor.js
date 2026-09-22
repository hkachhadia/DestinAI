"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTextFromPdf = extractTextFromPdf;
const pdf_parse_1 = __importDefault(require("pdf-parse"));
async function extractTextFromPdf(buffer) {
    const result = await (0, pdf_parse_1.default)(buffer);
    return result.text;
}
//# sourceMappingURL=pdfExtractor.js.map