export interface ScoreBreakdown {
  resumeScore: number;
  githubScore: number;
  cpScore: number;
  aiQualityScore: number;
}

export interface Score {
  overallScore: number;
  breakdown: ScoreBreakdown;
  computedAt: string;
}
