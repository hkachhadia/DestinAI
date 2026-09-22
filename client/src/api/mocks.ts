import type {
  ScoreOverview,
  HistoryListResponse,
  ComparisonResult,
  AICareerReport,
  InterviewQuestion,
  UserSettings,
} from '@/types/api';

export const mockScoreOverview: ScoreOverview = {
  breakdown: { careerScore: 84, resumeScore: 78, githubScore: 88, codingScore: 72, atsScore: 91 },
  computedAt: new Date().toISOString(),
  weightsUsed: { resume: 0.3, github: 0.3, coding: 0.25, skillMatch: 0.15 },
  skillMix: [
    { axis: 'Technical', current: 82 },
    { axis: 'Leadership', current: 54 },
    { axis: 'Communication', current: 66 },
    { axis: 'Systems Design', current: 71 },
    { axis: 'Delivery', current: 60 },
  ],
  competencyGaps: [
    { skill: 'Python & Data Engineering', current: 82, target: 95 },
    { skill: 'Machine Learning Ops', current: 45, target: 90 },
    { skill: 'Frontend & React Architecture', current: 68, target: 75 },
    { skill: 'AWS Cloud Infrastructure', current: 30, target: 85 },
  ],
  careerVelocity: [
    { month: 'Jan', value: 20 },
    { month: 'Mar', value: 35 },
    { month: 'May', value: 55 },
    { month: 'Jul', value: 68 },
    { month: 'Sep', value: 80, label: 'AI Specialist Level' },
    { month: 'Nov', value: 91 },
  ],
  syncActivity: Array.from({ length: 120 }, (_, i) => ({
    date: new Date(Date.now() - (119 - i) * 86400000).toISOString(),
    count: Math.floor(Math.random() * 12),
  })),
  recommendation: {
    message:
      "Based on your Python proficiency and GitHub activity, you're 15% away from qualifying for Senior Data Architect roles. Prioritize \"MLOps Pipeline Security\" next month to maximize market value.",
    ctaLabel: 'VIEW LEARNING PATH',
    ctaHref: '/ai-report',
  },
};

export const mockHistory: HistoryListResponse = {
  total: 3,
  entries: [
    { id: 'h3', title: 'Cloud Engineering Strategy', date: '2024-11-04', score: 92, icon: 'history' },
    { id: 'h2', title: 'Backend Developer V1', date: '2024-10-12', score: 78, icon: 'auto_graph' },
    { id: 'h1', title: 'Junior Web Dev Benchmark', date: '2024-09-15', score: 64, icon: 'description' },
  ],
};

export const mockComparison: ComparisonResult = {
  base: {
    id: 'h2',
    label: 'Previous Session — Oct 12',
    roleTitle: 'Systems Architect',
    focusArea: 'Legacy Infrastructure',
    score: 78,
    date: '2024-10-12',
  },
  compare: {
    id: 'h3',
    label: 'Latest Analysis — Today',
    roleTitle: 'Cloud Native Lead',
    focusArea: 'AI-Ops Integration',
    score: 94,
    date: '2024-11-04',
  },
  deltaPercent: 20.4,
  insight:
    'Your specialization in generative AI frameworks has increased your marketability score by 20.4%. Recommended next step: Enterprise Scale Certification.',
};

export const mockAIReport: AICareerReport = {
  roleTitle: 'Senior Product Designer',
  generatedAt: '2024-10-24',
  aiPrecision: 98,
  matchScore: 84,
  executiveSummary:
    'Your profile demonstrates an exceptional alignment with Senior Product Design roles in high-growth tech environments. Your specialized focus on complex design systems and product strategy places you in the top 5% of candidates.',
  strengths: [
    { title: 'Visual Precision', description: 'Exceptional eye for typography and layout hierarchies.' },
    { title: 'Prototyping Fidelity', description: 'Advanced mastery of interactive motion and transitions.' },
    { title: 'Systemic Thinking', description: 'Ability to build scalable design languages for global products.' },
  ],
  growthAreas: [
    { title: 'Data Literacy', description: 'Connecting design decisions to core business KPIs and metrics.' },
    { title: 'Stakeholder Management', description: 'Navigating complex organizational structures for buy-in.' },
  ],
  missingSkills: ['Node.js Basics', 'Business Strategy', 'User Psych', 'Public Speaking', 'Web3 Design'],
  urgentGap: 'Critical Gap: Quantitative Data Analysis',
  roadmap: [
    {
      id: 'p1',
      phase: 'Phase 01',
      title: 'Product Data Fluency',
      status: 'in_progress',
      description: 'Master the intersection of design and analytics.',
      tags: ['Google Analytics 4', 'Amplitude Mastery', 'SQL for Designers'],
    },
    {
      id: 'p2',
      phase: 'Phase 02',
      title: 'Design Leadership',
      status: 'locked',
      description: 'Transition from individual contributor to strategic leader.',
      tags: ['Strategic Storytelling', 'Budget Management'],
    },
  ],
  recommendedProjects: [
    { id: 'proj1', title: 'Data-Driven Dashboard Design', category: 'Fintech Case Study', description: 'Showcase conversion lift through design changes.' },
  ],
  coachTip:
    "When interviewing for Senior roles, stop talking about 'how' you designed it and start talking about 'why' the business needed it.",
};

export const mockInterviewQuestions: InterviewQuestion[] = [
  { id: 'q1', category: 'System Design', question: 'Design a rate limiter for a public API.', difficulty: 'medium', sampleApproach: 'Discuss token bucket vs sliding window, storage in Redis, per-user vs per-IP keys.' },
  { id: 'q2', category: 'DSA', question: 'Find the longest substring without repeating characters.', difficulty: 'easy', sampleApproach: 'Sliding window with a hashmap of last-seen indices.' },
  { id: 'q3', category: 'Behavioral', question: 'Tell me about a time you disagreed with a technical decision.', difficulty: 'easy', sampleApproach: 'STAR format; focus on how you gathered data to make your case.' },
];

export const mockSettings: UserSettings = {
  profile: {
    fullName: 'Alex Sterling',
    email: 'alex.sterling@techmail.ai',
    bio: 'Senior Solutions Architect with 10 years experience in cloud infrastructure.',
    memberSince: '2023-10-01',
  },
  notifications: { weeklyDigest: true, scoreAlerts: true, productUpdates: false },
  theme: 'dark',
};
