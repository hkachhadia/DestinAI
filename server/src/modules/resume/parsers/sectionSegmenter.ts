export type ResumeSectionName =
  | 'contact'
  | 'summary'
  | 'education'
  | 'experience'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'other';

const SECTION_HEADING_PATTERNS: { name: ResumeSectionName; patterns: RegExp[] }[] = [
  { name: 'summary', patterns: [/^(professional )?summary$/i, /^objective$/i, /^about( me)?$/i] },
  { name: 'education', patterns: [/^education( and training)?$/i, /^academic (background|qualifications?)$/i] },
  {
    name: 'experience',
    patterns: [
      /^(work |professional )?experience$/i,
      /^employment history$/i,
      /^work history$/i,
      /^internships?$/i,
    ],
  },
  {
    name: 'skills',
    patterns: [
      /^(technical )?skills( & tools)?$/i,
      /^core competenc(y|ies)$/i,
      /^technologies$/i,
      /^skills? summary$/i,
    ],
  },
  { name: 'projects', patterns: [/^projects?$/i, /^personal projects?$/i, /^academic projects?$/i] },
  {
    name: 'certifications',
    patterns: [/^certifications?( & licenses)?$/i, /^licenses?( & certifications)?$/i, /^courses?$/i],
  },
];

function matchHeading(line: string): ResumeSectionName | null {
  const trimmed = line.trim().replace(/[:\-–—]+$/, '');
  if (trimmed.length === 0 || trimmed.length > 40) return null;

  for (const { name, patterns } of SECTION_HEADING_PATTERNS) {
    if (patterns.some((p) => p.test(trimmed))) return name;
  }
  return null;
}

/**
 * Splits raw resume text into named section blocks using heading-line
 * detection. This is intentionally a lightweight heuristic pass — anything
 * ambiguous (unusual layouts, creative headings, dense project descriptions)
 * is left inside `other`/`experience` and later refined by the AI module
 * (see modules/ai), which structures free text into the final schema.
 */
export function segmentResumeSections(rawText: string): Record<ResumeSectionName, string> {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: Record<ResumeSectionName, string[]> = {
    contact: [],
    summary: [],
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: [],
    other: [],
  };

  let current: ResumeSectionName = 'contact';
  // The first few lines before any recognized heading are treated as contact/header info.
  let seenFirstHeading = false;

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      current = heading;
      seenFirstHeading = true;
      continue;
    }
    if (!seenFirstHeading) {
      sections.contact.push(line);
    } else {
      sections[current].push(line);
    }
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n')])
  ) as Record<ResumeSectionName, string>;
}
