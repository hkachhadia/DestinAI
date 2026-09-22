import { httpClient, unwrap } from './axiosClient';
import type { ApiEnvelope } from '@/types/api';

/** Full payload for both first-time analysis and re-analysis.
 * All fields except targetRole are optional — backend only processes
 * fields that are non-empty strings. */
export interface TriggerAnalysisPayload {
  targetRole?: string;
  // Platform handles to connect/update BEFORE scoring
  githubUsername?:     string;
  leetcodeUsername?:   string;
  codeforcesHandle?:   string;
  codechefUsername?:   string;
  gfgUsername?:        string;
  hackerrankUsername?: string;
  // Supplemental profile fields
  linkedinUrl?:    string;
  portfolioUrl?:   string;
  kaggleUsername?: string;
  mediumUsername?: string;
  devtoUsername?:  string;
}

export async function triggerAnalysis(payload?: TriggerAnalysisPayload): Promise<void> {
  await unwrap(httpClient.post<ApiEnvelope<unknown>>('/analysis', payload ?? {}));
}
