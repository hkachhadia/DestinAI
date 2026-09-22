"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAndParseResume = uploadAndParseResume;
exports.getLatestResume = getLatestResume;
exports.getResumeById = getResumeById;
const mongoose_1 = require("mongoose");
const resume_model_1 = require("./resume.model");
const pdfExtractor_1 = require("./parsers/pdfExtractor");
const docxExtractor_1 = require("./parsers/docxExtractor");
const sectionSegmenter_1 = require("./parsers/sectionSegmenter");
const entityNormalizer_1 = require("./parsers/entityNormalizer");
const ApiError_1 = require("../../utils/ApiError");
const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
async function uploadAndParseResume(input) {
    if (!SUPPORTED_MIME_TYPES.includes(input.mimeType)) {
        throw new ApiError_1.ApiError(415, 'Only PDF and DOCX resumes are supported', ApiError_1.ErrorCodes.UNSUPPORTED_FILE_TYPE);
    }
    const resume = await resume_model_1.Resume.create({
        userId: new mongoose_1.Types.ObjectId(input.userId),
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        status: 'parsing',
    });
    try {
        const rawText = input.mimeType === 'application/pdf'
            ? await (0, pdfExtractor_1.extractTextFromPdf)(input.buffer)
            : await (0, docxExtractor_1.extractTextFromDocx)(input.buffer);
        if (!rawText || rawText.trim().length < 30) {
            throw new ApiError_1.ApiError(422, 'Could not extract readable text from the uploaded file', ApiError_1.ErrorCodes.RESUME_PARSE_FAILED);
        }
        const sections = (0, sectionSegmenter_1.segmentResumeSections)(rawText);
        const { parsedData, atsFindings } = (0, entityNormalizer_1.normalizeParsedResume)(sections, rawText);
        resume.rawText = rawText;
        resume.parsedData = parsedData;
        resume.atsFindings = atsFindings;
        resume.status = 'parsed';
        await resume.save();
        return resume;
    }
    catch (err) {
        resume.status = 'failed';
        resume.failureReason = err instanceof Error ? err.message : 'Unknown parsing error';
        await resume.save();
        if (err instanceof ApiError_1.ApiError)
            throw err;
        throw new ApiError_1.ApiError(500, 'Resume parsing failed', ApiError_1.ErrorCodes.RESUME_PARSE_FAILED);
    }
}
async function getLatestResume(userId) {
    return resume_model_1.Resume.findOne({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 });
}
async function getResumeById(userId, resumeId) {
    const resume = await resume_model_1.Resume.findOne({ _id: resumeId, userId: new mongoose_1.Types.ObjectId(userId) });
    if (!resume)
        throw new ApiError_1.ApiError(404, 'Resume not found', ApiError_1.ErrorCodes.RESUME_NOT_FOUND);
    return resume;
}
//# sourceMappingURL=resume.service.js.map