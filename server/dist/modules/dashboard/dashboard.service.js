"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = getDashboard;
const mongoose_1 = require("mongoose");
const analysis_model_1 = require("../analysis/analysis.model");
const github_service_1 = require("../github/github.service");
const cp_service_1 = require("../competitiveProgramming/cp.service");
const resume_service_1 = require("../resume/resume.service");
const ai_service_1 = require("../ai/ai.service");
const ApiError_1 = require("../../utils/ApiError");
/** Heuristic derivation of 5 qualitative axes from the quantitative sub-scores
 * and raw signals we do have. This is explicitly a projection, not a new
 * measurement — documented here so nobody mistakes it for something Gemini
 * independently assessed. */
function deriveSkillMix(scores, experienceCount, commitsLastYear) {
    return [
        { axis: 'Technical', current: Math.round((scores.codingScore + scores.skillMatchScore) / 2) },
        { axis: 'Delivery', current: Math.round(Math.min((commitsLastYear / 300) * 100, 100)) },
        { axis: 'Communication', current: Math.round((scores.resumeScore + scores.skillMatchScore) / 2) },
        { axis: 'Systems Design', current: Math.round((scores.githubScore + scores.codingScore) / 2) },
        { axis: 'Leadership', current: Math.round(Math.min((experienceCount / 4) * 100, 100)) },
    ];
}
function deriveCompetencyGaps(requiredSkills, matchedSkills, keywordDensity) {
    const matchedSet = new Set(matchedSkills);
    return requiredSkills.slice(0, 6).map((skill) => {
        const density = keywordDensity[skill] ?? 0;
        const current = matchedSet.has(skill) ? Math.min(60 + density * 10, 95) : Math.min(10 + density * 5, 40);
        return { skill, current: Math.round(current), target: 100 };
    });
}
async function getDashboard(userId) {
    const [latest, recentHistory, github, competitiveProfiles, resume] = await Promise.all([
        analysis_model_1.Analysis.findOne({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 }),
        analysis_model_1.Analysis.find({ userId: new mongoose_1.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(12),
        (0, github_service_1.getGitHubProfile)(userId),
        (0, cp_service_1.getAllProfiles)(userId),
        (0, resume_service_1.getLatestResume)(userId),
    ]);
    if (!latest) {
        throw new ApiError_1.ApiError(404, 'No analysis has been run yet — POST /analysis first', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    const insight = latest.aiInsightId ? await (0, ai_service_1.getInsightByAnalysisId)(userId, String(latest._id)) : null;
    const experienceCount = resume?.parsedData?.experience?.length ?? 0;
    const skillMix = deriveSkillMix(latest.scores, experienceCount, github?.stats.totalCommitsLastYear ?? 0);
    const competencyGaps = deriveCompetencyGaps(latest.skillMatch.requiredSkills, latest.skillMatch.matchedSkills, {});
    const careerVelocity = [...recentHistory]
        .reverse()
        .map((a) => ({ date: a.createdAt.toISOString(), value: a.scores.careerScore }));
    const syncActivity = [
        ...(github ? [{ date: github.lastSyncedAt.toISOString(), count: github.stats.totalCommitsLastYear > 0 ? 1 : 0 }] : []),
        ...competitiveProfiles.map((p) => ({ date: p.lastSyncedAt.toISOString(), count: p.stats.problemsSolved.total > 0 ? 1 : 0 })),
    ];
    const lowestScoreEntry = Object.entries(latest.scores)
        .filter(([key]) => key !== 'careerScore')
        .sort((a, b) => a[1] - b[1])[0];
    const recommendation = {
        message: insight?.report.careerAdvice ??
            `Your ${lowestScoreEntry?.[0].replace('Score', '')} score (${lowestScoreEntry?.[1]}/100) is your biggest opportunity right now — focus there first.`,
        ctaLabel: 'VIEW LEARNING PATH',
        ctaHref: '/ai-report',
    };
    return {
        breakdown: {
            careerScore: latest.scores.careerScore,
            resumeScore: latest.scores.resumeScore,
            githubScore: latest.scores.githubScore,
            codingScore: latest.scores.codingScore,
            atsScore: latest.scores.atsScore,
        },
        computedAt: latest.createdAt.toISOString(),
        weightsUsed: latest.weightsUsed,
        skillMix,
        competencyGaps,
        careerVelocity,
        syncActivity,
        recommendation,
    };
}
//# sourceMappingURL=dashboard.service.js.map