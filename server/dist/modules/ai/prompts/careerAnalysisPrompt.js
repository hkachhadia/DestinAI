"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCareerAnalysisPrompt = buildCareerAnalysisPrompt;
/**
 * Builds the Gemini career-analysis prompt.
 *
 * Optimization goals:
 * - Keep the complete report structure required by the frontend.
 * - Send only relevant, compact profile information.
 * - Avoid repeating the same instructions throughout the prompt.
 * - Prevent unsupported numerical predictions.
 * - Keep Gemini focused on evidence from the supplied data.
 */
function buildCareerAnalysisPrompt(input) {
    const { targetRole, resume, github, competitiveProfiles, scores, missingSkillsFromEngine, } = input;
    const skills = resume?.parsedData?.skills ?? [];
    const experience = resume?.parsedData?.experience ?? [];
    const projects = resume?.parsedData?.projects ?? [];
    const education = resume?.parsedData?.education ?? [];
    const certifications = resume?.parsedData?.certifications ?? [];
    const atsMissing = resume?.atsFindings?.missing ?? [];
    const atsSuggestions = resume?.atsFindings?.suggestions ?? [];
    const experienceSummary = experience.length > 0
        ? `${experience.length} role${experience.length === 1 ? '' : 's'} listed`
        : 'No experience listed';
    const projectList = projects.length > 0
        ? projects
            .map((project) => `"${project.name}": ${(project.techStack ?? [])
            .slice(0, 5)
            .join(', ') || 'no technologies listed'}`)
            .join('; ')
        : 'No projects listed';
    const educationList = education.length > 0
        ? education
            .map((item) => `${item.degree} — ${item.institution}`)
            .join('; ')
        : 'Not listed';
    const certificationList = certifications.length > 0
        ? certifications.join(', ')
        : 'None';
    const githubSummary = github
        ? [
            `username=@${github.username}`,
            `publicRepos=${github.stats.publicRepos}`,
            `stars=${github.stats.totalStars}`,
            `commitsLastYear=${github.stats.totalCommitsLastYear}`,
            `followers=${github.stats.followers}`,
            `topLanguages=${github.stats.topLanguages
                .slice(0, 5)
                .map((language) => language.language)
                .join(', ') || 'none'}`,
        ].join(', ')
        : 'Not connected';
    const cpSummary = competitiveProfiles.length > 0
        ? competitiveProfiles
            .map((profile) => [
            `${profile.platform}=@${profile.handle}`,
            `rating=${profile.stats.rating}`,
            `solved=${profile.stats.problemsSolved.total}`,
            `easy=${profile.stats.problemsSolved.easy}`,
            `medium=${profile.stats.problemsSolved.medium}`,
            `hard=${profile.stats.problemsSolved.hard}`,
            `contests=${profile.stats.contestsAttended}`,
        ].join(', '))
            .join(' | ')
        : 'No competitive programming profiles';
    const missingSkills = missingSkillsFromEngine.length > 0
        ? missingSkillsFromEngine.join(', ')
        : 'None identified';
    const atsMissingList = atsMissing.length > 0
        ? atsMissing.join(', ')
        : 'None identified';
    const atsSuggestionList = atsSuggestions.length > 0
        ? atsSuggestions.join('; ')
        : 'None';
    /*
     * Keep the prompt compact while retaining the complete deterministic
     * data required for personalized recommendations.
     */
    return `
You are a career-intelligence AI for software/technology careers.

Analyze the supplied candidate data for the target role and return ONE valid JSON object matching the exact schema below.

CORE RULES:
- Use only the supplied candidate data for claims about the candidate.
- Do not invent candidate facts, projects, experience, skills, scores, repositories, certifications, or activity.
- Reference actual supplied scores/data when discussing the candidate.
- Recommendations may introduce skills, technologies, project ideas, certifications, and interview topics that are relevant to the target role, but clearly treat them as recommendations rather than existing candidate facts.
- Do not predict a future career score or promise a numerical improvement.
- Do not claim an exact metric unless that metric is supplied below.
- If evidence is missing, say so rather than inventing it.
- Return JSON only. No markdown, comments, or explanation outside JSON.

CANDIDATE DATA
Target role: ${targetRole}

Scores:
- Career: ${scores.careerScore}/100
- Resume: ${scores.resumeScore}/100
- GitHub: ${scores.githubScore}/100
- Coding: ${scores.codingScore}/100
- ATS: ${scores.atsScore}/100
- Skill match: ${scores.skillMatchScore ?? 0}/100

Resume:
- Skills: ${skills.length > 0 ? skills.join(', ') : 'None detected'}
- Experience: ${experienceSummary}
- Projects: ${projectList}
- Education: ${educationList}
- Certifications: ${certificationList}

GitHub:
${githubSummary}

Competitive programming:
${cpSummary}

ATS:
- Missing keywords: ${atsMissingList}
- Suggestions: ${atsSuggestionList}

Engine-identified skill gaps for ${targetRole}:
${missingSkills}

OUTPUT REQUIREMENTS

Return exactly these fields:

{
  "executiveSummary": "3-4 specific sentences referencing the target role, career score, and actual candidate evidence",

  "strengths": [
    {
      "title": "specific evidence-based strength",
      "description": "explain it using supplied candidate data"
    }
  ],

  "weaknesses": [
    {
      "title": "specific evidence-based weakness",
      "description": "explain the gap and why it matters for the target role"
    }
  ],

  "missingSkills": [
    "5-10 relevant skills not sufficiently represented in the supplied profile"
  ],

  "missingTechnologies": [
    "3-6 relevant tools/frameworks not sufficiently represented"
  ],

  "recommendedProjects": [
    {
      "title": "project addressing a real skill gap",
      "category": "category",
      "description": "specific project idea connected to the candidate's current stack and target role"
    }
  ],

  "learningRoadmap": [
    {
      "phase": "Beginner Foundation (Weeks 1-4)",
      "title": "specific phase goal",
      "description": "specific actions based on identified gaps",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Intermediate Building (Weeks 5-10)",
      "title": "specific phase goal",
      "description": "specific actions based on identified gaps",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Advanced Mastery (Weeks 11-16)",
      "title": "specific phase goal",
      "description": "specific advanced actions",
      "tags": ["skill1", "skill2"]
    },
    {
      "phase": "Portfolio & Job Prep (Weeks 17-20)",
      "title": "specific phase goal",
      "description": "specific portfolio and interview actions",
      "tags": ["skill1", "skill2"]
    }
  ],

  "interviewQuestions": [
    {
      "category": "Technical",
      "question": "role-specific technical question",
      "difficulty": "medium",
      "sampleApproach": "concise approach hint connected to the candidate"
    },
    {
      "category": "System Design",
      "question": "role-relevant system design question",
      "difficulty": "hard",
      "sampleApproach": "concise approach hint"
    },
    {
      "category": "Behavioral",
      "question": "candidate-relevant behavioral question",
      "difficulty": "easy",
      "sampleApproach": "concise STAR-based hint"
    },
    {
      "category": "Domain",
      "question": "target-role domain question",
      "difficulty": "medium",
      "sampleApproach": "concise hint"
    },
    {
      "category": "Coding",
      "question": "target-role coding problem type",
      "difficulty": "medium",
      "sampleApproach": "algorithm hint"
    },
    {
      "category": "Project",
      "question": "question about the candidate's project or relevant project work",
      "difficulty": "easy",
      "sampleApproach": "what to highlight"
    }
  ],

  "certifications": [
    "3-5 relevant real certifications that address identified gaps"
  ],

  "careerAdvice": "2-3 specific sentences based on the supplied scores, gaps, and target role",

  "plan30Day": [
    "Day 1-7: specific action with measurable outcome",
    "Day 8-14: specific action",
    "Day 15-21: specific action",
    "Day 22-30: specific action with measurable outcome"
  ],

  "plan60Day": [
    "Week 5-6: specific action building on the first 30 days",
    "Week 7-8: specific action",
    "Expected outcome by day 60: concrete skill/portfolio outcome, not a predicted score"
  ],

  "plan90Day": [
    "Week 9-10: specific advanced action",
    "Week 11-12: portfolio/interview preparation",
    "Week 13: mock interview/application preparation",
    "Expected outcome by day 90: concrete portfolio, skill, or interview-readiness outcome without predicting a score"
  ],

  "interviewReadiness": 0,

  "industryReadiness": 0,

  "recommendationConfidence": [
    {
      "recommendation": "most impactful recommendation",
      "confidence": 0,
      "confidenceLabel": "Low",
      "reason": "evidence-based reason using supplied data"
    },
    {
      "recommendation": "second recommendation",
      "confidence": 0,
      "confidenceLabel": "Low",
      "reason": "evidence-based reason using supplied data"
    },
    {
      "recommendation": "third recommendation",
      "confidence": 0,
      "confidenceLabel": "Low",
      "reason": "evidence-based reason using supplied data"
    }
  ]
}

QUANTITY RULES:
- strengths: 3-5
- weaknesses: 3-5
- recommendedProjects: 3-5
- learningRoadmap: exactly 4 phases
- interviewQuestions: exactly 6
- certifications: 3-5
- plan30Day: exactly 4
- plan60Day: exactly 3
- plan90Day: exactly 4
- recommendationConfidence: exactly 3

READINESS RULES:
- interviewReadiness and industryReadiness must be integers from 0-100.
- Base them only on supplied evidence.
- They are assessment scores, not predictions.
- Do not claim that implementing the roadmap will increase either score by a specific number.

CONFIDENCE RULES:
- High: 85-100
- Medium: 65-84
- Low: 40-64
- Confidence must reflect the strength of the supplied evidence for the recommendation.

IMPORTANT:
Do not repeat the entire candidate data inside the response.
Keep descriptions concise but personalized.
`;
}
//# sourceMappingURL=careerAnalysisPrompt.js.map