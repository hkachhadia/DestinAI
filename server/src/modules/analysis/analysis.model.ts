import { Schema, model, Document, Types } from 'mongoose';
import { SCORE_WEIGHTS } from '../scoring/rules/weights';

export interface IAnalysis extends Document {
  userId: Types.ObjectId;
  targetRole: string;
  inputsSnapshot: {
    resumeId: Types.ObjectId | null;
    githubProfileId: Types.ObjectId | null;
    competitiveProfileIds: Types.ObjectId[];
  };
  scores: {
    resumeScore: number;
    githubScore: number;
    codingScore: number;
    skillMatchScore: number;
    atsScore: number;
    careerScore: number;
  };
  weightsUsed: typeof SCORE_WEIGHTS;
  skillMatch: {
    requiredSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
  };
  aiInsightId: Types.ObjectId | null;
  createdAt: Date;
}

const analysisSchema = new Schema<IAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true },
    inputsSnapshot: {
      resumeId: { type: Schema.Types.ObjectId, ref: 'Resume', default: null },
      githubProfileId: { type: Schema.Types.ObjectId, ref: 'GitHubProfile', default: null },
      competitiveProfileIds: [{ type: Schema.Types.ObjectId, ref: 'CompetitiveProfile' }],
    },
    scores: {
      resumeScore: { type: Number, required: true },
      githubScore: { type: Number, required: true },
      codingScore: { type: Number, required: true },
      skillMatchScore: { type: Number, required: true },
      atsScore: { type: Number, required: true },
      careerScore: { type: Number, required: true },
    },
    weightsUsed: {
      resume: Number,
      github: Number,
      coding: Number,
      skillMatch: Number,
      ats: Number,
    },
    skillMatch: {
      requiredSkills: [String],
      matchedSkills: [String],
      missingSkills: [String],
    },
    aiInsightId: { type: Schema.Types.ObjectId, ref: 'AIInsight', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

analysisSchema.index({ userId: 1, createdAt: -1 });

export const Analysis = model<IAnalysis>('Analysis', analysisSchema);
