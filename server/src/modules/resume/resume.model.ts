import { Schema, model, Document, Types } from 'mongoose';

export type ResumeStatus = 'uploaded' | 'parsing' | 'parsed' | 'failed';

export interface IResumeExperience {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  bullets?: string[];
  description?: string; // normalizer alias
}

export interface IResumeEducation {
  institution?: string;
  degree?: string;
  year?: string;
  gpa?: string;
}

export interface IResumeProject {
  name?: string;
  description?: string;
  techStack?: string[];
  tech?: string[]; // alias used in some prompt code
}

export interface IResumeParsedData {
  fullName?: string;
  email?: string;
  phone?: string;
  links?: string[];
  education?: IResumeEducation[];
  experience?: IResumeExperience[];
  projects?: IResumeProject[];
  skills?: string[];
  certifications?: string[];
}

export interface IAtsFindings {
  score: number;           // 0-100
  missing: string[];       // keywords absent from the resume
  suggestions: string[];   // actionable fixes
}

export interface IResume extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  originalFilename: string;
  mimeType: string;
  status: ResumeStatus;
  parsedData?: IResumeParsedData;
  atsFindings?: IAtsFindings;
  rawText?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Alias types that server-2 parsers use
export type IParsedResume = IResumeParsedData;

const resumeSchema = new Schema<IResume>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    status: {
      type: String,
      enum: ['uploaded', 'parsing', 'parsed', 'failed'],
      default: 'uploaded',
    },
    parsedData: {
      type: new Schema(
        {
          fullName: String, email: String, phone: String, links: [String],
          education: [{ institution: String, degree: String, year: String, gpa: String }],
          experience: [{ company: String, title: String, startDate: String, endDate: String, bullets: [String], description: String }],
          projects: [{ name: String, description: String, techStack: [String], tech: [String] }],
          skills: [String],
          certifications: [String],
        },
        { _id: false }
      ),
      default: undefined,
    },
    atsFindings: {
      type: new Schema({ score: Number, missing: [String], suggestions: [String] }, { _id: false }),
      default: undefined,
    },
    rawText: { type: String, select: false },
    failureReason: String,
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = model<IResume>('Resume', resumeSchema);
// Legacy alias used by server-1 imports
export const ResumeModel = Resume;
