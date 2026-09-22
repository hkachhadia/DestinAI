import type { IResume } from '../resume/resume.model';
import type { IGitHubProfile } from '../github/github.model';
import type { ICompetitiveProfile } from '../competitiveProgramming/cp.model';
import { SCORE_WEIGHTS } from './rules/weights';
import { scaleToPoints, toScore100 } from './rules/normalizer';
import { getRequiredSkillsForRole } from './rules/roleSkillMap';

export interface ScoreBreakdown {
  resumeScore: number;
  githubScore: number;
  codingScore: number;
  skillMatchScore: number;
  atsScore: number;
  careerScore: number;
}

export interface SkillMatchDetail {
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface ScoringResult {
  breakdown: ScoreBreakdown;
  weightsUsed: typeof SCORE_WEIGHTS;
  skillMatch: SkillMatchDetail;
}

/** This is the ONLY place Career Score math happens. It is a pure function
 * of its inputs — same resume/github/cp/targetRole always produces the same
 * score. No AI, no randomness, no hidden state. The AI module (Gemini)
 * produces the narrative report; this module produces the number. */
export function computeScores(input: {
  resume: IResume | null;
  github: IGitHubProfile | null;
  competitiveProfiles: ICompetitiveProfile[];
  targetRole?: string;
}): ScoringResult {
  const resumeScore = computeResumeScore(input.resume);
  const githubScore = computeGitHubScore(input.github);
  const codingScore = computeCodingScore(input.competitiveProfiles);
  const atsScore = input.resume?.atsFindings?.score ?? 0;
  const { score: skillMatchScore, ...skillMatch } = computeSkillMatch(input.resume, input.github, input.targetRole);

  const careerScore = toScore100(
    resumeScore * SCORE_WEIGHTS.resume +
      githubScore * SCORE_WEIGHTS.github +
      codingScore * SCORE_WEIGHTS.coding +
      skillMatchScore * SCORE_WEIGHTS.skillMatch +
      atsScore * SCORE_WEIGHTS.ats
  );

  return {
    breakdown: {
      resumeScore: toScore100(resumeScore),
      githubScore: toScore100(githubScore),
      codingScore: toScore100(codingScore),
      skillMatchScore: toScore100(skillMatchScore),
      atsScore: toScore100(atsScore),
      careerScore,
    },
    weightsUsed: SCORE_WEIGHTS,
    skillMatch,
  };
}

function computeResumeScore(resume: IResume | null): number {
  if (!resume || resume.status !== 'parsed') return 0;
  const { skills = [], experience = [], projects = [], education = [], certifications = [] } = resume.parsedData ?? {};

  return (
    scaleToPoints(skills?.length ?? 0, 15, 30) +
    scaleToPoints(experience?.length ?? 0, 3, 25) +
    scaleToPoints(projects?.length ?? 0, 4, 25) +
    (education?.length ? 10 : 0) +
    scaleToPoints(certifications?.length ?? 0, 3, 10)
  );
}

function computeGitHubScore(github: IGitHubProfile | null): number {
  if (!github) return 0;
  const { publicRepos, totalStars, totalCommitsLastYear, followers, topLanguages } = github.stats;

  return (
    scaleToPoints(publicRepos, 30, 25) +
    scaleToPoints(totalStars, 50, 25) +
    scaleToPoints(totalCommitsLastYear, 500, 30) +
    scaleToPoints(followers, 50, 10) +
    scaleToPoints(topLanguages?.length ?? 0, 5, 10)
  );
}

function computeCodingScore(profiles: ICompetitiveProfile[]): number {
  const active = profiles.filter((p) => p.stats.problemsSolved.total > 0 || p.stats.rating > 0);
  if (active.length === 0) return 0;

  const perPlatformScores = active.map((p) => {
    const problemsComponent = scaleToPoints(p.stats.problemsSolved.total, 300, 60);
    const ratingComponent = scaleToPoints(p.stats.rating, 2000, 40);
    return problemsComponent + ratingComponent;
  });

  return perPlatformScores.reduce((a, b) => a + b, 0) / perPlatformScores.length;
}

function computeSkillMatch(
  resume: IResume | null,
  github: IGitHubProfile | null,
  targetRole?: string
): SkillMatchDetail & { score: number } {
  const requiredSkills = getRequiredSkillsForRole(targetRole);

  const candidateSkills = new Set<string>([
    ...(resume?.parsedData?.skills ?? []),
    ...(github?.stats.topLanguages.map((l) => l.language) ?? []),
  ]);
  const candidateSkillsLower = new Set(Array.from(candidateSkills).map((s) => s.toLowerCase()));

  const matchedSkills = requiredSkills.filter((skill) => candidateSkillsLower.has(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !candidateSkillsLower.has(skill.toLowerCase()));

  const score = requiredSkills.length === 0 ? 0 : (matchedSkills.length / requiredSkills.length) * 100;

  return { requiredSkills, matchedSkills, missingSkills, score };
}
