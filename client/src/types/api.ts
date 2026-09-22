/**
 * DestinAI — Complete API contract types.
 * Keep in sync with server response shapes.
 */

// ---------- Shared envelope ----------
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta?: { requestId?: string; timestamp?: string };
}

// ---------- Score Overview ----------
export interface ScoreBreakdown {
  careerScore: number;
  resumeScore: number;
  githubScore: number;
  codingScore: number;
  atsScore: number;
  skillMatchScore?: number;
}

export interface SkillMixAxis {
  axis: string;
  current: number;
  target?: number;
}

export interface CompetencyGap {
  skill: string;
  current: number;
  target: number;
  gap?: number;
}

export interface CareerVelocityPoint {
  month: string;
  value: number;
  label?: string;
}

export interface SyncActivityDay {
  date: string;
  count: number;
}

export interface AIQuickRecommendation {
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface ScoreOverview {
  breakdown: ScoreBreakdown;
  computedAt: string;
  weightsUsed: Record<string, number>;
  skillMix: SkillMixAxis[];
  competencyGaps: CompetencyGap[];
  careerVelocity: CareerVelocityPoint[];
  syncActivity: SyncActivityDay[];
  recommendation: AIQuickRecommendation;
  connectedSources?: { resume: boolean; github: boolean; cp: boolean };
  roleReadiness?: number;
  industryReadiness?: number;
}

// ---------- Score Breakdown (CHANGE 7 — transparent scoring) ----------
export interface ScoreComponent {
  label: string;
  score: number;
  maxScore: number;
  reason: string;
  missingItems: string[];
  improvementSuggestion: string;
  potentialGain: number;
}

export interface TransparentScoreBreakdown {
  overall: number;
  components: ScoreComponent[];
  generatedAt: string;
}

// ---------- History ----------
export interface HistoryEntry {
  id: string;
  title: string;
  date: string;
  score: number;
  icon: string;
  scores?: ScoreBreakdown;
}

export interface HistoryListResponse {
  entries: HistoryEntry[];
  total: number;
}

// ---------- Rich Comparison (CHANGE 4) ----------
export interface RichComparisonSnapshot {
  id: string;
  label: string;
  roleTitle: string;
  focusArea: string;
  score: number;
  scores: ScoreBreakdown;
  skillMatch: {
    requiredSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
  };
  date: string;
}

export interface RichComparisonResult {
  base: RichComparisonSnapshot;
  compare: RichComparisonSnapshot;
  deltaPercent: number;
  scoreDeltas: {
    resumeScore: number;
    githubScore: number;
    codingScore: number;
    skillMatchScore: number;
    atsScore: number;
    careerScore: number;
  };
  newlyMatchedSkills: string[];
  skillsLost: string[];
  stillMissingSkills: string[];
  improvedSkillCount: number;
  insight: string;
}

// Legacy — used by useComparison hook
export interface ComparisonSnapshot {
  id: string;
  label: string;
  roleTitle: string;
  focusArea: string;
  score: number;
  date: string;
}

export interface ComparisonResult {
  base: ComparisonSnapshot;
  compare: ComparisonSnapshot;
  deltaPercent: number;
  insight: string;
}

// ---------- AI Career Report ----------
export interface AIStrengthOrGap {
  title: string;
  description: string;
}

export interface RoadmapPhase {
  id: string;
  phase: string;
  title: string;
  status: 'in_progress' | 'locked' | 'completed';
  description: string;
  tags: string[];
}

export interface RecommendedProject {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl?: string;
}

export interface AICareerReport {
  roleTitle: string;
  generatedAt: string;
  aiPrecision: number;
  matchScore: number;
  executiveSummary: string;
  strengths: AIStrengthOrGap[];
  growthAreas: AIStrengthOrGap[];
  missingSkills: string[];
  urgentGap: string | null;
  roadmap: RoadmapPhase[];
  recommendedProjects: RecommendedProject[];
  coachTip: string;
  // Extended fields (CHANGE 6)
  plan30Day?: string[];
  plan60Day?: string[];
  plan90Day?: string[];
  certifications?: string[];
  interviewReadiness?: number;
  industryReadiness?: number;
  recommendationConfidence?: { recommendation: string; confidence: number; confidenceLabel: 'Low' | 'Medium' | 'High'; reason: string }[];
}

// ---------- Interview Preparation ----------
export interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sampleApproach: string;
}

// ---------- Settings ----------
export interface UserSettingsProfile {
  fullName: string;
  email: string;
  bio: string;
  avatarUrl?: string;
  memberSince: string;
}

export interface UserSettings {
  profile: UserSettingsProfile;
  notifications: {
    weeklyDigest: boolean;
    scoreAlerts: boolean;
    productUpdates: boolean;
  };
  theme: 'dark' | 'light';
}
