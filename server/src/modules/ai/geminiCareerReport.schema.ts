import { z } from 'zod';

const strengthOrWeaknessSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const roadmapPhaseSchema = z.object({
  phase: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
});

const recommendedProjectSchema = z.object({
  title: z.string(),
  category: z.string(),
  description: z.string(),
});

const interviewQuestionSchema = z.object({
  category: z.string(),
  question: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  sampleApproach: z.string().default(''),
});

const recommendationConfidenceSchema = z.object({
  recommendation: z.string(),
  confidence: z.number().min(0).max(100),
  confidenceLabel: z.enum(['Low', 'Medium', 'High']),
  reason: z.string(),
});

export const geminiCareerReportSchema = z.object({
  executiveSummary:          z.string().default(''),
  strengths:                 z.array(strengthOrWeaknessSchema).default([]),
  weaknesses:                z.array(strengthOrWeaknessSchema).default([]),
  missingSkills:             z.array(z.string()).default([]),
  missingTechnologies:       z.array(z.string()).default([]),
  recommendedProjects:       z.array(recommendedProjectSchema).default([]),
  learningRoadmap:           z.array(roadmapPhaseSchema).default([]),
  interviewQuestions:        z.array(interviewQuestionSchema).default([]),
  certifications:            z.array(z.string()).default([]),
  careerAdvice:              z.string().default(''),
  plan30Day:                 z.array(z.string()).default([]),
  plan60Day:                 z.array(z.string()).default([]),
  plan90Day:                 z.array(z.string()).default([]),
  interviewReadiness:        z.number().min(0).max(100).default(50),
  industryReadiness:         z.number().min(0).max(100).default(50),
  recommendationConfidence:  z.array(recommendationConfidenceSchema).default([]),
});

export type GeminiCareerReport = z.infer<typeof geminiCareerReportSchema>;
