import { IResume } from '@modules/resume/resume.model';
import { IGitHubProfile } from '@modules/github/github.model';
import { ICompetitiveProfile } from '@modules/competitiveProgramming/cp.model';

interface ScoreBreakdown {
  careerScore: number;
  resumeScore: number;
  githubScore: number;
  codingScore: number;
  atsScore: number;
  skillMatchScore?: number;
}

interface PromptInput {
  targetRole: string;
  resume: IResume | null;
  github: IGitHubProfile | null;
  competitiveProfiles: ICompetitiveProfile[];
  scores: ScoreBreakdown;
  missingSkillsFromEngine: string[];
}

export function buildCareerAnalysisPrompt(input: PromptInput): string {
  const { targetRole, resume, github, competitiveProfiles, scores, missingSkillsFromEngine } = input;

  const skills        = resume?.parsedData?.skills       ?? [];
  const experience    = resume?.parsedData?.experience   ?? [];
  const projects      = resume?.parsedData?.projects     ?? [];
  const education     = resume?.parsedData?.education    ?? [];
  const certs         = resume?.parsedData?.certifications ?? [];
  const atsScore      = scores.atsScore;
  const atsMissing    = resume?.atsFindings?.missing      ?? [];
  const atsSuggestions = resume?.atsFindings?.suggestions ?? [];

  const expYears = experience.length > 0
    ? `${experience.length} role${experience.length > 1 ? 's' : ''} listed`
    : 'No experience listed';

  const githubSummary = github
    ? `GitHub: @${github.username}, ${github.stats.publicRepos} public repos, ` +
      `${github.stats.totalStars} total stars, ` +
      `${github.stats.totalCommitsLastYear} commits last year, ` +
      `top languages: ${github.stats.topLanguages.slice(0, 5).map(l => l.language).join(', ')}, ` +
      `followers: ${github.stats.followers}`
    : 'GitHub: not connected';

  const cpSummary = competitiveProfiles.length > 0
    ? competitiveProfiles.map(p =>
        `${p.platform}: ${p.handle} — ` +
        `rating=${p.stats.rating}, ` +
        `solved=${p.stats.problemsSolved.total} (E:${p.stats.problemsSolved.easy}/M:${p.stats.problemsSolved.medium}/H:${p.stats.problemsSolved.hard}), ` +
        `contests=${p.stats.contestsAttended}`
      ).join(' | ')
    : 'No competitive programming profiles';

  const projectList = projects.length > 0
    ? projects.map(p => `"${p.name}": ${(p.techStack ?? []).slice(0, 4).join(', ')}`).join('; ')
    : 'No projects listed';

  return `You are a senior career intelligence AI specializing in software engineering careers. 
Analyze this developer profile and produce a comprehensive, deeply personalized career report.
Every output must reference the actual numbers and data below — never produce generic advice.

═══════════════════════════════════════════════════════
PROFILE DATA
═══════════════════════════════════════════════════════
Target Role:    ${targetRole}
Career Score:   ${scores.careerScore}/100
Resume Score:   ${scores.resumeScore}/100
GitHub Score:   ${scores.githubScore}/100
Coding Score:   ${scores.codingScore}/100
ATS Score:      ${atsScore}/100

Skills present: ${skills.length > 0 ? skills.join(', ') : 'none detected'}
Experience:     ${expYears}
Projects:       ${projectList}
Education:      ${education.map(e => `${e.degree} — ${e.institution}`).join('; ') || 'not listed'}
Certifications: ${certs.join(', ') || 'none'}

${githubSummary}
Competitive Programming: ${cpSummary}

ATS missing keywords:  ${atsMissing.join(', ') || 'none identified'}
ATS improvement tips:  ${atsSuggestions.join('; ') || 'none'}
Engine-identified skill gaps for ${targetRole}: ${missingSkillsFromEngine.join(', ') || 'none'}

═══════════════════════════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════════════════════════
Return ONLY a single valid JSON object. No markdown, no explanations outside JSON.

Confidence scoring rules:
- High (85-100): strong evidence from multiple data points
- Medium (65-84): evidence from one data point or indirect inference
- Low (40-64): absence of data or indirect signal only

Return this exact JSON structure:
{
  "executiveSummary": "3-4 sentence specific assessment referencing their ACTUAL scores (${scores.careerScore}/100 career score), their actual ${targetRole} target, and concrete profile observations",

  "strengths": [
    {"title": "specific strength from data", "description": "cite actual numbers or projects"}
  ],

  "weaknesses": [
    {"title": "specific weakness from gaps", "description": "cite what is actually missing and why it matters for ${targetRole}"}
  ],

  "missingSkills": ["list 5-10 skills required for ${targetRole} absent from their profile"],

  "missingTechnologies": ["list 3-6 tools/frameworks absent but needed"],

  "recommendedProjects": [
    {
      "title": "Project that directly addresses a gap",
      "category": "category",
      "description": "specific description referencing their actual tech stack and missing skills"
    }
  ],

  "learningRoadmap": [
    {
      "phase": "Beginner Foundation (Weeks 1-4)",
      "title": "specific title for this phase",
      "description": "specific actions based on their actual skill gaps",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Intermediate Building (Weeks 5-10)",
      "title": "specific title",
      "description": "specific actions",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Advanced Mastery (Weeks 11-16)",
      "title": "specific title",
      "description": "specific advanced actions",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Portfolio & Job Prep (Weeks 17-20)",
      "title": "specific title",
      "description": "specific capstone and interview prep",
      "tags": ["skill1", "skill2"]
    }
  ],

  "interviewQuestions": [
    {"category": "Technical", "question": "role-specific technical question for ${targetRole}", "difficulty": "medium", "sampleApproach": "concrete hint referencing their background"},
    {"category": "System Design", "question": "system design question relevant to ${targetRole}", "difficulty": "hard", "sampleApproach": "approach hint"},
    {"category": "Behavioral", "question": "behavioral question", "difficulty": "easy", "sampleApproach": "STAR method hint specific to their experience"},
    {"category": "Domain", "question": "domain-specific question for ${targetRole}", "difficulty": "medium", "sampleApproach": "hint"},
    {"category": "Coding", "question": "specific coding problem type likely asked for ${targetRole}", "difficulty": "medium", "sampleApproach": "algorithm hint"},
    {"category": "Project", "question": "question about ${projects.length > 0 ? (projects[0]?.name ?? 'their main project') : 'a project they built'}", "difficulty": "easy", "sampleApproach": "what to highlight"}
  ],

  "certifications": ["3-5 specific real certifications that directly address their gaps for ${targetRole}"],

  "careerAdvice": "2-3 sentences of highly specific advice referencing their actual scores and role",

  "plan30Day": [
    "Day 1-7: specific action with measurable outcome referencing their actual skill gap",
    "Day 8-14: specific action",
    "Day 15-21: specific action",
    "Day 22-30: specific action and measurable target (e.g. solve 20 LeetCode mediums)"
  ],

  "plan60Day": [
    "Week 5-6: specific action building on 30-day foundation",
    "Week 7-8: specific action",
    "Expected outcome by day 60: specific measurable improvement"
  ],

  "plan90Day": [
    "Week 9-10: specific advanced action",
    "Week 11-12: portfolio/interview preparation",
    "Week 13: specific mock interview or application target",
    "Expected career score improvement: +X points by implementing all recommendations"
  ],

  "interviewReadiness": <integer 0-100 based on: coding score ${scores.codingScore}/100, projects count ${projects.length}, experience ${expYears}, problem variety>,

  "industryReadiness": <integer 0-100 based on: career score ${scores.careerScore}/100, github activity, skills match, experience>,

  "recommendationConfidence": [
    {
      "recommendation": "most impactful recommendation title",
      "confidence": <integer 40-100>,
      "confidenceLabel": "<Low|Medium|High>",
      "reason": "specific reason citing actual data: e.g. 'Resume shows 0 SQL keywords, GitHub has no database repos, and ${targetRole} requires advanced SQL (ATS missing: ${atsMissing.slice(0,3).join(', ')})'"
    },
    {
      "recommendation": "second most impactful recommendation",
      "confidence": <integer 40-100>,
      "confidenceLabel": "<Low|Medium|High>",
      "reason": "specific reason with data citation"
    },
    {
      "recommendation": "third recommendation",
      "confidence": <integer 40-100>,
      "confidenceLabel": "<Low|Medium|High>",
      "reason": "specific reason"
    }
  ]
}

Produce 3-5 strengths, 3-5 weaknesses, 3-5 recommended projects, exactly 4 roadmap phases, exactly 6 interview questions, 3-5 certifications, 4 plan30Day items, 3 plan60Day items, 4 plan90Day items, exactly 3 confidence entries.`;
}
