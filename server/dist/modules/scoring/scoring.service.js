"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeScores = computeScores;
const weights_1 = require("./rules/weights");
const normalizer_1 = require("./rules/normalizer");
const roleSkillMap_1 = require("./rules/roleSkillMap");
/** This is the ONLY place Career Score math happens. It is a pure function
 * of its inputs — same resume/github/cp/targetRole always produces the same
 * score. No AI, no randomness, no hidden state. The AI module (Gemini)
 * produces the narrative report; this module produces the number. */
function computeScores(input) {
    const resumeScore = computeResumeScore(input.resume);
    const githubScore = computeGitHubScore(input.github);
    const codingScore = computeCodingScore(input.competitiveProfiles);
    const atsScore = input.resume?.atsFindings?.score ?? 0;
    const { score: skillMatchScore, ...skillMatch } = computeSkillMatch(input.resume, input.github, input.targetRole);
    const careerScore = (0, normalizer_1.toScore100)(resumeScore * weights_1.SCORE_WEIGHTS.resume +
        githubScore * weights_1.SCORE_WEIGHTS.github +
        codingScore * weights_1.SCORE_WEIGHTS.coding +
        skillMatchScore * weights_1.SCORE_WEIGHTS.skillMatch +
        atsScore * weights_1.SCORE_WEIGHTS.ats);
    return {
        breakdown: {
            resumeScore: (0, normalizer_1.toScore100)(resumeScore),
            githubScore: (0, normalizer_1.toScore100)(githubScore),
            codingScore: (0, normalizer_1.toScore100)(codingScore),
            skillMatchScore: (0, normalizer_1.toScore100)(skillMatchScore),
            atsScore: (0, normalizer_1.toScore100)(atsScore),
            careerScore,
        },
        weightsUsed: weights_1.SCORE_WEIGHTS,
        skillMatch,
    };
}
function computeResumeScore(resume) {
    if (!resume || resume.status !== 'parsed')
        return 0;
    const { skills = [], experience = [], projects = [], education = [], certifications = [] } = resume.parsedData ?? {};
    return ((0, normalizer_1.scaleToPoints)(skills?.length ?? 0, 15, 30) +
        (0, normalizer_1.scaleToPoints)(experience?.length ?? 0, 3, 25) +
        (0, normalizer_1.scaleToPoints)(projects?.length ?? 0, 4, 25) +
        (education?.length ? 10 : 0) +
        (0, normalizer_1.scaleToPoints)(certifications?.length ?? 0, 3, 10));
}
function computeGitHubScore(github) {
    if (!github)
        return 0;
    const { publicRepos, totalStars, totalCommitsLastYear, followers, topLanguages } = github.stats;
    return ((0, normalizer_1.scaleToPoints)(publicRepos, 30, 25) +
        (0, normalizer_1.scaleToPoints)(totalStars, 50, 25) +
        (0, normalizer_1.scaleToPoints)(totalCommitsLastYear, 500, 30) +
        (0, normalizer_1.scaleToPoints)(followers, 50, 10) +
        (0, normalizer_1.scaleToPoints)(topLanguages?.length ?? 0, 5, 10));
}
function computeCodingScore(profiles) {
    const active = profiles.filter((p) => p.stats.problemsSolved.total > 0 || p.stats.rating > 0);
    if (active.length === 0)
        return 0;
    const perPlatformScores = active.map((p) => {
        const problemsComponent = (0, normalizer_1.scaleToPoints)(p.stats.problemsSolved.total, 300, 60);
        const ratingComponent = (0, normalizer_1.scaleToPoints)(p.stats.rating, 2000, 40);
        return problemsComponent + ratingComponent;
    });
    return perPlatformScores.reduce((a, b) => a + b, 0) / perPlatformScores.length;
}
function computeSkillMatch(resume, github, targetRole) {
    const requiredSkills = (0, roleSkillMap_1.getRequiredSkillsForRole)(targetRole);
    const candidateSkills = new Set([
        ...(resume?.parsedData?.skills ?? []),
        ...(github?.stats.topLanguages.map((l) => l.language) ?? []),
    ]);
    const candidateSkillsLower = new Set(Array.from(candidateSkills).map((s) => s.toLowerCase()));
    const matchedSkills = requiredSkills.filter((skill) => candidateSkillsLower.has(skill.toLowerCase()));
    const missingSkills = requiredSkills.filter((skill) => !candidateSkillsLower.has(skill.toLowerCase()));
    const score = requiredSkills.length === 0 ? 0 : (matchedSkills.length / requiredSkills.length) * 100;
    return { requiredSkills, matchedSkills, missingSkills, score };
}
//# sourceMappingURL=scoring.service.js.map