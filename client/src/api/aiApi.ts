import { httpClient, unwrap } from './axiosClient';
import { mockAIReport, mockInterviewQuestions } from './mocks';
import type { ApiEnvelope, AICareerReport, InterviewQuestion, RoadmapPhase, RecommendedProject } from '@/types/api';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

interface ServerAIReportResponse {
  analysis: {
    targetRole: string;
    scores: { careerScore: number; resumeScore: number; githubScore: number; codingScore: number; atsScore: number; skillMatchScore?: number };
    skillMatch: { requiredSkills: string[]; matchedSkills: string[]; missingSkills: string[] };
    createdAt: string;
  };
  insight: {
    report: {
      executiveSummary?: string;
      strengths?: { title: string; description: string }[];
      weaknesses?: { title: string; description: string }[];
      missingSkills?: string[];
      missingTechnologies?: string[];
      recommendedProjects?: { title: string; category: string; description: string }[];
      learningRoadmap?: { phase: string; title: string; description: string; tags: string[] }[];
      interviewQuestions?: { category: string; question: string; difficulty: 'easy' | 'medium' | 'hard'; sampleApproach: string }[];
      certifications?: string[];
      careerAdvice?: string;
      plan30Day?: string[];
      plan60Day?: string[];
      plan90Day?: string[];
      interviewReadiness?: number;
      industryReadiness?: number;
      recommendationConfidence?: { recommendation: string; confidence: number; confidenceLabel: 'Low' | 'Medium' | 'High'; reason: string }[];
    };
  } | null;
}

function mapToAICareerReport(raw: ServerAIReportResponse): AICareerReport {
  const report = raw.insight?.report;
  return {
    roleTitle:        raw.analysis.targetRole,
    generatedAt:      raw.analysis.createdAt,
    aiPrecision:      95,
    matchScore:       raw.analysis.scores.careerScore,
    executiveSummary: report?.executiveSummary ?? report?.careerAdvice ?? 'Run a career analysis to generate your AI career report.',
    strengths:        report?.strengths ?? [],
    growthAreas:      report?.weaknesses ?? [],
    missingSkills:    report?.missingSkills ?? raw.analysis.skillMatch.missingSkills,
    urgentGap:        (report?.missingSkills ?? raw.analysis.skillMatch.missingSkills)[0]
      ? `Critical Gap: ${(report?.missingSkills ?? raw.analysis.skillMatch.missingSkills)[0]}`
      : null,
    roadmap: (report?.learningRoadmap ?? []).map((p, i): RoadmapPhase => ({
      id: `phase-${i}`, phase: p.phase, title: p.title,
      status: i === 0 ? 'in_progress' : 'locked', description: p.description, tags: p.tags ?? [],
    })),
    recommendedProjects: (report?.recommendedProjects ?? []).map((p, i): RecommendedProject => ({
      id: `proj-${i}`, title: p.title, category: p.category, description: p.description,
    })),
    coachTip:          report?.careerAdvice ?? '',
    plan30Day:         report?.plan30Day ?? [],
    plan60Day:         report?.plan60Day ?? [],
    plan90Day:         report?.plan90Day ?? [],
    certifications:    report?.certifications ?? [],
    interviewReadiness:report?.interviewReadiness ?? 50,
    industryReadiness: report?.industryReadiness ?? 50,
    recommendationConfidence: report?.recommendationConfidence ?? [],
  };
}

export async function fetchLatestAIReport(): Promise<AICareerReport> {
  if (useMocks) return Promise.resolve(mockAIReport);
  const raw = await unwrap(httpClient.get<ApiEnvelope<ServerAIReportResponse>>('/ai/insights/career-report/latest'));
  return mapToAICareerReport(raw);
}

/** CHANGE 2: Refresh only AI narrative — does NOT re-run the full analysis */
export async function refreshAIInsights(): Promise<AICareerReport> {
  if (useMocks) return Promise.resolve(mockAIReport);
  const raw = await unwrap(httpClient.post<ApiEnvelope<ServerAIReportResponse>>('/ai/insights/refresh'));
  return mapToAICareerReport(raw);
}

export async function fetchInterviewPrep(): Promise<InterviewQuestion[]> {
  if (useMocks) return Promise.resolve(mockInterviewQuestions);
  const raw = await unwrap(
    httpClient.get<ApiEnvelope<{ targetRole: string; questions: InterviewQuestion[]; careerAdvice: string }>>('/ai/insights/interview-prep')
  );
  return (raw.questions ?? []).map((q, i) => ({ ...q, id: q.id ?? `q-${i}` }));
}

/** Test Gemini connectivity — only works with a valid GEMINI_API_KEY on the server. */
export async function testGeminiConnectivity(): Promise<{
  ok: boolean;
  model?: string;
  latencyMs?: number;
  error?: string;
  hint?: string;
}> {
  try {
    const { data } = await httpClient.get<{ ok: boolean; model?: string; latencyMs?: number; error?: string; hint?: string }>(
      '/ai/diagnostic'
    );
    return data;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
