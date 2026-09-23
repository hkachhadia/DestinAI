import { httpClient, unwrap } from './axiosClient';

import type { ApiEnvelope } from '@/types/api';

/**
 * Full payload for both first-time analysis and re-analysis.
 *
 * All fields except targetRole are optional — backend only processes
 * fields that are non-empty strings.
 */
export interface TriggerAnalysisPayload {
  targetRole?: string;

  // Platform handles to connect/update BEFORE scoring
  githubUsername?: string;
  leetcodeUsername?: string;
  codeforcesHandle?: string;
  codechefUsername?: string;
  gfgUsername?: string;
  hackerrankUsername?: string;

  // Supplemental profile fields
  linkedinUrl?: string;
  portfolioUrl?: string;
  kaggleUsername?: string;
  mediumUsername?: string;
  devtoUsername?: string;
}

/**
 * Minimal analysis shape required by the frontend after analysis completes.
 *
 * The backend returns the complete Analysis document, but we only
 * depend on these fields here.
 */
export interface TriggerAnalysisResponse {
  _id: string;
  targetRole: string;
  createdAt: string;

  scores?: {
    careerScore?: number;
    resumeScore?: number;
    githubScore?: number;
    codingScore?: number;
    atsScore?: number;
    skillMatchScore?: number;
  };

  skillMatch?: {
    requiredSkills?: string[];
    matchedSkills?: string[];
    missingSkills?: string[];
  };

  aiInsightId?: string | null;
}

/**
 * Runs the deterministic career analysis.
 *
 * IMPORTANT:
 * This endpoint no longer waits for Gemini AI generation.
 * The returned analysis ID is used to start AI generation separately.
 */
export async function triggerAnalysis(
  payload?: TriggerAnalysisPayload,
): Promise<TriggerAnalysisResponse> {
  const raw = await unwrap(
    httpClient.post<
      ApiEnvelope<TriggerAnalysisResponse>
    >('/analysis', payload ?? {}),
  );

  return raw;
}