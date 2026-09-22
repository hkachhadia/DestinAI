import { Types } from 'mongoose';
import { Analysis } from '../analysis/analysis.model';
import { getGitHubProfile } from '../github/github.service';
import { getAllProfiles } from '../competitiveProgramming/cp.service';
import { getLatestResume } from '../resume/resume.service';
import { getInsightByAnalysisId } from '../ai/ai.service';
import { ApiError, ErrorCodes } from '@utils/ApiError';

export interface DashboardSkillMixAxis {
  axis: string;
  current: number;
}

export interface DashboardCompetencyGap {
  skill: string;
  current: number;
  target: number;
}

export interface DashboardVelocityPoint {
  date: string;
  value: number;
}

export interface DashboardSyncDay {
  date: string;
  count: number;
}

export interface DashboardPayload {
  breakdown: {
    careerScore: number;
    resumeScore: number;
    githubScore: number;
    codingScore: number;
    atsScore: number;
  };
  computedAt: string;
  weightsUsed: Record<string, number>;
  skillMix: DashboardSkillMixAxis[];
  competencyGaps: DashboardCompetencyGap[];
  careerVelocity: DashboardVelocityPoint[];
  syncActivity: DashboardSyncDay[];
  recommendation: { message: string; ctaLabel: string; ctaHref: string };
}

/** Heuristic derivation of 5 qualitative axes from the quantitative sub-scores
 * and raw signals we do have. This is explicitly a projection, not a new
 * measurement — documented here so nobody mistakes it for something Gemini
 * independently assessed. */
function deriveSkillMix(
  scores: { resumeScore: number; githubScore: number; codingScore: number; skillMatchScore: number },
  experienceCount: number,
  commitsLastYear: number
): DashboardSkillMixAxis[] {
  return [
    { axis: 'Technical', current: Math.round((scores.codingScore + scores.skillMatchScore) / 2) },
    { axis: 'Delivery', current: Math.round(Math.min((commitsLastYear / 300) * 100, 100)) },
    { axis: 'Communication', current: Math.round((scores.resumeScore + scores.skillMatchScore) / 2) },
    { axis: 'Systems Design', current: Math.round((scores.githubScore + scores.codingScore) / 2) },
    { axis: 'Leadership', current: Math.round(Math.min((experienceCount / 4) * 100, 100)) },
  ];
}

function deriveCompetencyGaps(
  requiredSkills: string[],
  matchedSkills: string[],
  keywordDensity: Record<string, number>
): DashboardCompetencyGap[] {
  const matchedSet = new Set(matchedSkills);
  return requiredSkills.slice(0, 6).map((skill) => {
    const density = keywordDensity[skill] ?? 0;
    const current = matchedSet.has(skill) ? Math.min(60 + density * 10, 95) : Math.min(10 + density * 5, 40);
    return { skill, current: Math.round(current), target: 100 };
  });
}

export async function getDashboard(userId: string): Promise<DashboardPayload> {
  const [latest, recentHistory, github, competitiveProfiles, resume] = await Promise.all([
    Analysis.findOne({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }),
    Analysis.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(12),
    getGitHubProfile(userId),
    getAllProfiles(userId),
    getLatestResume(userId),
  ]);

  if (!latest) {
    throw new ApiError(404, 'No analysis has been run yet — POST /analysis first', ErrorCodes.ANALYSIS_NOT_FOUND);
  }

  const insight = latest.aiInsightId ? await getInsightByAnalysisId(userId, String(latest._id)) : null;

  const experienceCount = resume?.parsedData?.experience?.length ?? 0;

  const skillMix = deriveSkillMix(latest.scores, experienceCount, github?.stats.totalCommitsLastYear ?? 0);

  const competencyGaps = deriveCompetencyGaps(
    latest.skillMatch.requiredSkills,
    latest.skillMatch.matchedSkills,
    {}
  );

  const careerVelocity: DashboardVelocityPoint[] = [...recentHistory]
    .reverse()
    .map((a) => ({ date: a.createdAt.toISOString(), value: a.scores.careerScore }));

  const syncActivity: DashboardSyncDay[] = [
    ...(github ? [{ date: github.lastSyncedAt.toISOString(), count: github.stats.totalCommitsLastYear > 0 ? 1 : 0 }] : []),
    ...competitiveProfiles.map((p) => ({ date: p.lastSyncedAt.toISOString(), count: p.stats.problemsSolved.total > 0 ? 1 : 0 })),
  ];

  const lowestScoreEntry = (Object.entries(latest.scores) as [string, number][])
    .filter(([key]) => key !== 'careerScore')
    .sort((a, b) => a[1] - b[1])[0];

  const recommendation = {
    message:
      insight?.report.careerAdvice ??
      `Your ${lowestScoreEntry?.[0].replace('Score', '')} score (${lowestScoreEntry?.[1]}/100) is your biggest opportunity right now — focus there first.`,
    ctaLabel: 'VIEW LEARNING PATH',
    ctaHref: '/ai-report',
  };

  return {
    breakdown: {
      careerScore: latest.scores.careerScore,
      resumeScore: latest.scores.resumeScore,
      githubScore: latest.scores.githubScore,
      codingScore: latest.scores.codingScore,
      atsScore: latest.scores.atsScore,
    },
    computedAt: latest.createdAt.toISOString(),
    weightsUsed: latest.weightsUsed,
    skillMix,
    competencyGaps,
    careerVelocity,
    syncActivity,
    recommendation,
  };
}
