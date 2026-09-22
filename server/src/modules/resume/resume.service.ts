import { Types } from 'mongoose';
import { Resume, IResume } from './resume.model';
import { extractTextFromPdf } from './parsers/pdfExtractor';
import { extractTextFromDocx } from './parsers/docxExtractor';
import { segmentResumeSections } from './parsers/sectionSegmenter';
import { normalizeParsedResume } from './parsers/entityNormalizer';
import { ApiError, ErrorCodes } from '@utils/ApiError';

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export interface UploadInput {
  userId: string;
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

export async function uploadAndParseResume(input: UploadInput): Promise<IResume> {
  if (!SUPPORTED_MIME_TYPES.includes(input.mimeType as (typeof SUPPORTED_MIME_TYPES)[number])) {
    throw new ApiError(415, 'Only PDF and DOCX resumes are supported', ErrorCodes.UNSUPPORTED_FILE_TYPE);
  }

  const resume = await Resume.create({
    userId: new Types.ObjectId(input.userId),
    originalFilename: input.originalFilename,
    mimeType: input.mimeType,
    status: 'parsing',
  });

  try {
    const rawText =
      input.mimeType === 'application/pdf'
        ? await extractTextFromPdf(input.buffer)
        : await extractTextFromDocx(input.buffer);

    if (!rawText || rawText.trim().length < 30) {
      throw new ApiError(422, 'Could not extract readable text from the uploaded file', ErrorCodes.RESUME_PARSE_FAILED);
    }

    const sections = segmentResumeSections(rawText);
    const { parsedData, atsFindings } = normalizeParsedResume(sections, rawText);

    resume.rawText = rawText;
    resume.parsedData = parsedData;
    resume.atsFindings = atsFindings;
    resume.status = 'parsed';
    await resume.save();
    return resume;
  } catch (err) {
    resume.status = 'failed';
    resume.failureReason = err instanceof Error ? err.message : 'Unknown parsing error';
    await resume.save();
    if (err instanceof ApiError) throw err;
    throw new ApiError(500, 'Resume parsing failed', ErrorCodes.RESUME_PARSE_FAILED);
  }
}

export async function getLatestResume(userId: string): Promise<IResume | null> {
  return Resume.findOne({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
}

export async function getResumeById(userId: string, resumeId: string): Promise<IResume> {
  const resume = await Resume.findOne({ _id: resumeId, userId: new Types.ObjectId(userId) });
  if (!resume) throw new ApiError(404, 'Resume not found', ErrorCodes.RESUME_NOT_FOUND);
  return resume;
}
