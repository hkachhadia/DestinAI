import type { ResumeSectionName } from './sectionSegmenter';
import type { IParsedResume, IAtsFindings } from '../resume.model';

/** Canonical skill name map — collapses common aliasing so scoring/skill-match
 * later isn't fooled by "React.js" vs "ReactJS" vs "React" being 3 different
 * strings. Extend this list; it's data, not logic. */
const SKILL_ALIASES: Record<string, string> = {
  'react.js': 'React',
  reactjs: 'React',
  react: 'React',
  'node.js': 'Node.js',
  nodejs: 'Node.js',
  node: 'Node.js',
  'express.js': 'Express',
  expressjs: 'Express',
  py: 'Python',
  python3: 'Python',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  'c++': 'C++',
  cpp: 'C++',
  'c#': 'C#',
  csharp: 'C#',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongo: 'MongoDB',
  mongodb: 'MongoDB',
  aws: 'AWS',
  gcp: 'GCP',
  'google cloud': 'GCP',
  ml: 'Machine Learning',
  'machine-learning': 'Machine Learning',
  dl: 'Deep Learning',
  nlp: 'NLP',
  k8s: 'Kubernetes',
  kubernetes: 'Kubernetes',
  docker: 'Docker',
  git: 'Git',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
};

const SKILL_SPLIT_REGEX = /[,•|/\n]+/;

export function normalizeSkillName(raw: string): string {
  const cleaned = raw.trim().replace(/^[-*•]\s*/, '');
  const key = cleaned.toLowerCase();
  return SKILL_ALIASES[key] ?? cleaned;
}

export function extractSkillList(skillsSectionText: string): string[] {
  const tokens = skillsSectionText
    .split(SKILL_SPLIT_REGEX)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length < 40);

  const normalized = tokens.map(normalizeSkillName);
  return Array.from(new Set(normalized));
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d{1,3}[\s-]?)?(\(?\d{3,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/;
const URL_REGEX = /(https?:\/\/[^\s]+|(?:www\.)?(?:github|linkedin|leetcode|codeforces)\.[^\s]+)/gi;

function extractContact(contactText: string, fullText: string) {
  const searchSpace = `${contactText}\n${fullText.slice(0, 600)}`;
  const email = searchSpace.match(EMAIL_REGEX)?.[0];
  const phone = searchSpace.match(PHONE_REGEX)?.[0]?.trim();
  const links = Array.from(new Set(searchSpace.match(URL_REGEX) ?? []));
  const firstLine = contactText.split('\n').find((l) => l.trim().length > 0);
  return { name: firstLine?.trim(), email, phone, links };
}

function extractEducation(text: string): IParsedResume['education'] {
  if (!text.trim()) return [];
  const blocks = text.split(/\n{1,2}/).filter(Boolean);
  return blocks.map((block) => {
    const yearMatch = block.match(/(19|20)\d{2}\s*[-–—to]{0,4}\s*((19|20)\d{2}|present)?/i);
    const [startYear, endYear] = (yearMatch?.[0] ?? '').split(/[-–—]|to/i).map((s) => s?.trim());
    const firstLine = block.split('\n')[0] ?? block;
    return {
      degree: firstLine.trim(),
      institution: block.split('\n')[1]?.trim() ?? '',
      startYear: startYear || undefined,
      endYear: endYear || undefined,
    };
  });
}

function extractExperience(text: string): IParsedResume['experience'] {
  if (!text.trim()) return [];
  const blocks = text.split(/\n{1,2}(?=[A-Z])/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').filter(Boolean);
    const dateMatch = block.match(/(19|20)\d{2}.*?(present|(19|20)\d{2})/i);
    return {
      title: lines[0]?.trim() ?? '',
      company: lines[1]?.trim() ?? '',
      startDate: dateMatch?.[0]?.split(/[-–—]/)[0]?.trim(),
      endDate: dateMatch?.[0]?.split(/[-–—]/)[1]?.trim(),
      description: lines.slice(2).join(' ').trim(),
    };
  });
}

function extractProjects(text: string, skillVocabulary: string[]): IParsedResume['projects'] {
  if (!text.trim()) return [];
  const blocks = text.split(/\n{1,2}(?=[A-Z])/).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n').filter(Boolean);
    const description = lines.slice(1).join(' ').trim();
    const tech = skillVocabulary.filter((skill) =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(block)
    );
    return { name: lines[0]?.trim() ?? '', description, tech };
  });
}

function extractCertifications(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^[-*•]\s*/, '').trim())
    .filter(Boolean);
}

/** ATS heuristic pass — independent of the AI module, so ATS Score can be
 * computed deterministically (see modules/scoring). */
function computeAtsFindings(
  sections: Record<ResumeSectionName, string>,
  rawText: string,
  skills: string[]
): IAtsFindings {
  const issues: string[] = [];

  const hasStandardSections = ['education', 'experience', 'skills'].every(
    (s) => sections[s as ResumeSectionName]?.trim().length > 0
  );
  if (!hasStandardSections) issues.push('Missing one or more standard section headings (Education/Experience/Skills)');

  const hasContactInfo = Boolean(rawText.match(EMAIL_REGEX));
  if (!hasContactInfo) issues.push('No email address detected — ATS systems may reject resumes without contact info');

  const hasQuantifiedAchievements = /\d+%|\$\d|\d+x\b|\bincreased\b.*\d|\bреduced\b.*\d|\d+\s*(users|customers|requests|records)/i.test(
    rawText
  );
  if (!hasQuantifiedAchievements) issues.push('Few or no quantified achievements (numbers/percentages) detected');

  // Very long lines or heavy special-character density are often symptomatic
  // of multi-column/table layouts that ATS parsers mangle.
  const longLineRatio =
    rawText.split('\n').filter((l) => l.length > 180).length / Math.max(rawText.split('\n').length, 1);
  const usesParsableFormatting = longLineRatio < 0.05;
  if (!usesParsableFormatting) issues.push('Possible multi-column or table layout detected — may not parse cleanly in ATS systems');

  const keywordDensityBySkill: Record<string, number> = {};
  for (const skill of skills) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    keywordDensityBySkill[skill] = (rawText.match(regex) ?? []).length;
  }

  let score = 100;
  if (!hasStandardSections) score -= 25;
  if (!hasContactInfo) score -= 20;
  if (!hasQuantifiedAchievements) score -= 20;
  if (!usesParsableFormatting) score -= 15;
  if (skills.length < 5) {
    score -= 10;
    issues.push('Fewer than 5 distinct skills detected — consider expanding the Skills section');
  }
  score = Math.max(0, Math.min(100, score));

  // Only return the fields in IAtsFindings: score, missing, suggestions
  const missing = skills.filter(s => (keywordDensityBySkill[s] ?? 0) === 0);
  return { score, missing, suggestions: issues };
}

export function normalizeParsedResume(
  sections: Record<ResumeSectionName, string>,
  rawText: string
): { parsedData: IParsedResume; atsFindings: IAtsFindings } {
  const skills = extractSkillList(sections.skills);
  const parsedData: IParsedResume = {
    education: extractEducation(sections.education),
    experience: extractExperience(sections.experience),
    skills,
    projects: extractProjects(sections.projects, skills),
    certifications: extractCertifications(sections.certifications),
    // contact: extractContact(sections.contact, rawText),
  };

  const atsFindings = computeAtsFindings(sections, rawText, skills);

  return { parsedData, atsFindings };
}
