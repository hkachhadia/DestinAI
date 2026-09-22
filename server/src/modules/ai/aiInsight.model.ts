import { Schema, model, Document, Types } from 'mongoose';

export interface IRecommendationConfidence {
  recommendation: string;
  confidence: number;        // 0-100
  confidenceLabel: 'Low' | 'Medium' | 'High';
  reason: string;
}

export interface IAIInsight extends Document {
  userId: Types.ObjectId;
  analysisId: Types.ObjectId;
  targetRole: string;
  report: {
    executiveSummary: string;
    strengths: { title: string; description: string }[];
    weaknesses: { title: string; description: string }[];
    missingSkills: string[];
    missingTechnologies: string[];
    recommendedProjects: { title: string; category: string; description: string }[];
    learningRoadmap: { phase: string; title: string; description: string; tags: string[] }[];
    interviewQuestions: {
      category: string;
      question: string;
      difficulty: 'easy' | 'medium' | 'hard';
      sampleApproach: string;
    }[];
    certifications: string[];
    careerAdvice: string;
    plan30Day: string[];
    plan60Day: string[];
    plan90Day: string[];
    interviewReadiness: number;
    industryReadiness: number;
    // Explainable AI: confidence levels for top recommendations
    recommendationConfidence: IRecommendationConfidence[];
  };
  rawModelResponse: string;
  createdAt: Date;
}

const confidenceSchema = new Schema<IRecommendationConfidence>(
  {
    recommendation: String,
    confidence: { type: Number, min: 0, max: 100, default: 75 },
    confidenceLabel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    reason: String,
  },
  { _id: false }
);

const aiInsightSchema = new Schema<IAIInsight>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    analysisId: { type: Schema.Types.ObjectId, ref: 'Analysis', required: true, index: true },
    targetRole: { type: String, required: true },
    report: {
      executiveSummary:    { type: String, default: '' },
      strengths:           [{ title: String, description: String }],
      weaknesses:          [{ title: String, description: String }],
      missingSkills:       [String],
      missingTechnologies: [String],
      recommendedProjects: [{ title: String, category: String, description: String }],
      learningRoadmap: [{
        phase: String, title: String, description: String, tags: [String],
      }],
      interviewQuestions: [{
        category: String, question: String, difficulty: String, sampleApproach: String,
      }],
      certifications:          { type: [String], default: [] },
      careerAdvice:            { type: String, default: '' },
      plan30Day:               { type: [String], default: [] },
      plan60Day:               { type: [String], default: [] },
      plan90Day:               { type: [String], default: [] },
      interviewReadiness:      { type: Number, default: 50 },
      industryReadiness:       { type: Number, default: 50 },
      recommendationConfidence:{ type: [confidenceSchema], default: [] },
    },
    rawModelResponse: { type: String, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiInsightSchema.index({ userId: 1, analysisId: 1 }, { unique: true });

export const AIInsight = model<IAIInsight>('AIInsight', aiInsightSchema);
