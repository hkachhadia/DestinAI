import { logger } from '@config/logger';
import { Types } from 'mongoose';

import { Analysis, IAnalysis } from './analysis.model';

import { getLatestResume } from '../resume/resume.service';

import {
  connectGitHub,
  getGitHubProfile,
  syncGitHubProfile,
} from '../github/github.service';

import {
  connectPlatform,
  getAllProfiles,
  syncPlatform,
} from '../competitiveProgramming/cp.service';

import { computeScores } from '../scoring/scoring.service';

import { ApiError, ErrorCodes } from '@utils/ApiError';

import { User } from '@modules/user/user.model';

export interface RunAnalysisOptions {
  targetRole?: string;

  /**
   * Kept for compatibility with existing callers.
   *
   * AI generation is now handled separately from runAnalysis(),
   * so this option is no longer used inside this function.
   */
  skipAIReport?: boolean;

  // Platform handles — if provided, connect/update BEFORE scoring
  githubUsername?: string;
  leetcodeUsername?: string;
  codeforcesHandle?: string;
  codechefUsername?: string;
  gfgUsername?: string;
  hackerrankUsername?: string;

  // Supplemental profile fields (saved to user profile)
  linkedinUrl?: string;
  portfolioUrl?: string;
  kaggleUsername?: string;
  mediumUsername?: string;
  devtoUsername?: string;

  // Force full re-sync regardless of staleness
  // (used by explicit re-analysis)
  forceSync?: boolean;
}

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

function isStale(
  lastSyncedAt: Date | null | undefined,
  force = false,
): boolean {
  if (force) return true;
  if (!lastSyncedAt) return true;

  return (
    Date.now() - new Date(lastSyncedAt).getTime() >
    STALE_THRESHOLD_MS
  );
}

/**
 * If new handles are provided in options, connect/update them first.
 * Then auto-sync any stale existing profiles.
 *
 * This ensures re-analysis always uses the freshest possible data,
 * including new usernames entered in the modal.
 */
async function prepareProfiles(
  userId: string,
  options: RunAnalysisOptions,
): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  // ── Step 1: Connect or update provided handles ──────────────────────────

  if (options.githubUsername) {
    jobs.push(
      connectGitHub(userId, options.githubUsername).catch((err) =>
        logger.warn(
          `[REANALYSIS] GitHub connect failed: ${(err as Error).message}`,
        ),
      ),
    );
  }

  const cpUpdates: { platform: string; handle: string }[] = [];

  if (options.leetcodeUsername) {
    cpUpdates.push({
      platform: 'leetcode',
      handle: options.leetcodeUsername,
    });
  }

  if (options.codeforcesHandle) {
    cpUpdates.push({
      platform: 'codeforces',
      handle: options.codeforcesHandle,
    });
  }

  if (options.codechefUsername) {
    cpUpdates.push({
      platform: 'codechef',
      handle: options.codechefUsername,
    });
  }

  if (options.gfgUsername) {
    cpUpdates.push({
      platform: 'gfg',
      handle: options.gfgUsername,
    });
  }

  if (options.hackerrankUsername) {
    cpUpdates.push({
      platform: 'hackerrank',
      handle: options.hackerrankUsername,
    });
  }

  for (const cp of cpUpdates) {
    jobs.push(
      connectPlatform(userId, cp.platform, cp.handle).catch((err) =>
        logger.warn(
          `[REANALYSIS] ${cp.platform} connect failed: ${(err as Error).message}`,
        ),
      ),
    );
  }

  // Save supplemental profile fields
  const supplemental: Record<string, string> = {};

  if (options.linkedinUrl) {
    supplemental.linkedinUrl = options.linkedinUrl;
  }

  if (options.portfolioUrl) {
    supplemental.portfolioUrl = options.portfolioUrl;
  }

  if (options.kaggleUsername) {
    supplemental.kaggleUsername = options.kaggleUsername;
  }

  if (options.mediumUsername) {
    supplemental.mediumUsername = options.mediumUsername;
  }

  if (options.devtoUsername) {
    supplemental.devtoUsername = options.devtoUsername;
  }

  if (Object.keys(supplemental).length > 0) {
    jobs.push(
      User.findByIdAndUpdate(userId, {
        $set: supplemental,
      }).catch((err) =>
        logger.warn(
          `[REANALYSIS] Supplemental profile update failed: ${
            (err as Error).message
          }`,
        ),
      ),
    );
  }

  // Execute all connection jobs in parallel
  if (jobs.length > 0) {
    await Promise.allSettled(jobs);
  }

  // ── Step 2: Auto-sync stale existing profiles ───────────────────────────

  const [github, cpProfiles] = await Promise.all([
    getGitHubProfile(userId),
    getAllProfiles(userId),
  ]);

  const syncJobs: Promise<unknown>[] = [];

  const forceSync = options.forceSync ?? false;

  if (github && isStale(github.lastSyncedAt, forceSync)) {
    syncJobs.push(
      syncGitHubProfile(userId).catch((err) =>
        logger.warn(
          `[AUTO_SYNC] GitHub sync failed: ${(err as Error).message}`,
        ),
      ),
    );
  }

  for (const profile of cpProfiles) {
    if (isStale(profile.lastSyncedAt, forceSync)) {
      syncJobs.push(
        syncPlatform(userId, profile.platform).catch((err) =>
          logger.warn(
            `[AUTO_SYNC] ${profile.platform} sync failed: ${
              (err as Error).message
            }`,
          ),
        ),
      );
    }
  }

  if (syncJobs.length > 0) {
    logger.info(
      `[AUTO_SYNC] Syncing ${syncJobs.length} stale profile(s) for user ${userId}`,
    );

    await Promise.allSettled(syncJobs);
  }
}

export async function runAnalysis(
  userId: string,
  options: RunAnalysisOptions = {},
): Promise<IAnalysis> {
  // Step 1: Connect new handles + sync stale profiles
  await prepareProfiles(userId, options);

  // Step 2: Read fresh profile data
  const [user, resume, github, competitiveProfiles] = await Promise.all([
    User.findById(userId),
    getLatestResume(userId),
    getGitHubProfile(userId),
    getAllProfiles(userId),
  ]);

  if (!resume && !github && competitiveProfiles.length === 0) {
    throw new ApiError(
      422,
      'Please connect at least one data source: upload a resume, link your GitHub, or connect a coding platform (LeetCode, Codeforces, etc.) before running analysis.',
      ErrorCodes.ANALYSIS_PREREQUISITES_MISSING,
    );
  }

  const targetRole =
    options.targetRole ??
    user?.targetRole ??
    'Software Engineer';

  // Step 3: Compute deterministic scores
  const { breakdown, weightsUsed, skillMatch } = computeScores({
    resume,
    github,
    competitiveProfiles,
    targetRole,
  });

  // Step 4: Persist analysis — always creates a NEW document
  const analysis = await Analysis.create({
    userId: new Types.ObjectId(userId),
    targetRole,

    inputsSnapshot: {
      resumeId: resume?._id ?? null,
      githubProfileId: github?._id ?? null,
      competitiveProfileIds: competitiveProfiles.map(
        (p) => p._id,
      ),
    },

    scores: breakdown,
    weightsUsed,
    skillMatch,

    // AI will be generated separately after the analysis response.
    aiInsightId: null,
  });

  /**
   * IMPORTANT:
   *
   * Gemini AI generation intentionally does NOT happen here anymore.
   *
   * runAnalysis() now finishes as soon as the deterministic analysis
   * has been calculated and persisted.
   *
   * The AI report will be generated separately using the analysis ID.
   *
   * This prevents the POST /analysis request from waiting for Gemini.
   */

  logger.info('[ANALYSIS] Deterministic analysis completed', {
    userId,
    analysisId: String(analysis._id),
    targetRole,
    resumeConnected: !!resume,
    githubConnected: !!github,
    cpCount: competitiveProfiles.length,
    careerScore: breakdown.careerScore,
  });

  return analysis;
}

export async function getAnalysisById(
  userId: string,
  analysisId: string,
): Promise<IAnalysis> {
  const analysis = await Analysis.findOne({
    _id: analysisId,
    userId: new Types.ObjectId(userId),
  });

  if (!analysis) {
    throw new ApiError(
      404,
      'Analysis not found',
      ErrorCodes.ANALYSIS_NOT_FOUND,
    );
  }

  return analysis;
}

export async function getLatestAnalysis(
  userId: string,
): Promise<IAnalysis | null> {
  return Analysis.findOne({
    userId: new Types.ObjectId(userId),
  }).sort({ createdAt: -1 });
}

export async function deleteAnalysis(
  userId: string,
  analysisId: string,
): Promise<void> {
  const analysis = await Analysis.findOne({
    _id: analysisId,
    userId: new Types.ObjectId(userId),
  });

  if (!analysis) {
    throw new ApiError(
      404,
      'Analysis not found',
      ErrorCodes.ANALYSIS_NOT_FOUND,
    );
  }

  await analysis.deleteOne();
}

export async function deleteAllAnalyses(
  userId: string,
): Promise<{ deletedCount: number }> {
  const result = await Analysis.deleteMany({
    userId: new Types.ObjectId(userId),
  });

  return {
    deletedCount: result.deletedCount,
  };
}