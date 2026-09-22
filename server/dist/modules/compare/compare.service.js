"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareAnalyses = compareAnalyses;
const analysis_model_1 = require("../analysis/analysis.model");
const ApiError_1 = require("../../utils/ApiError");
async function findAnalysis(userId, id) {
    const doc = await analysis_model_1.Analysis.findOne({ _id: id, userId });
    if (!doc)
        throw new ApiError_1.ApiError(404, `Analysis ${id} not found`, ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    return doc;
}
async function compareAnalyses(userId, baseId, compareId) {
    const [base, compare] = await Promise.all([
        findAnalysis(userId, baseId),
        findAnalysis(userId, compareId),
    ]);
    const deltaPercent = base.scores.careerScore === 0
        ? 0
        : Math.round(((compare.scores.careerScore - base.scores.careerScore) / base.scores.careerScore) * 1000) / 10;
    const scoreDeltas = {
        resumeScore: compare.scores.resumeScore - base.scores.resumeScore,
        githubScore: compare.scores.githubScore - base.scores.githubScore,
        codingScore: compare.scores.codingScore - base.scores.codingScore,
        skillMatchScore: compare.scores.skillMatchScore - base.scores.skillMatchScore,
        atsScore: compare.scores.atsScore - base.scores.atsScore,
        careerScore: compare.scores.careerScore - base.scores.careerScore,
    };
    const baseMatchedSet = new Set(base.skillMatch?.matchedSkills ?? []);
    const compareMissingSet = new Set(compare.skillMatch?.missingSkills ?? []);
    const compareMatchedSet = new Set(compare.skillMatch?.matchedSkills ?? []);
    const newlyMatchedSkills = (compare.skillMatch?.matchedSkills ?? []).filter((s) => !baseMatchedSet.has(s));
    const skillsLost = (base.skillMatch?.matchedSkills ?? []).filter((s) => !compareMatchedSet.has(s));
    const stillMissingSkills = compare.skillMatch?.missingSkills ?? [];
    const improvedSkillCount = newlyMatchedSkills.length;
    const direction = deltaPercent > 0 ? 'improved' : deltaPercent < 0 ? 'declined' : 'unchanged';
    const insight = direction === 'improved'
        ? `Your career score improved by ${deltaPercent}% between these snapshots.${improvedSkillCount > 0
            ? ` You added ${improvedSkillCount} new skill${improvedSkillCount > 1 ? 's' : ''}: ${newlyMatchedSkills.slice(0, 3).join(', ')}.`
            : ''}${compareMissingSet.size > 0 ? ` Focus next on: ${stillMissingSkills.slice(0, 2).join(', ')}.` : ''}`
        : direction === 'declined'
            ? `Your score declined by ${Math.abs(deltaPercent)}%. ${stillMissingSkills.length > 0 ? `Priority gaps: ${stillMissingSkills.slice(0, 3).join(', ')}.` : 'Review your profile data for accuracy.'}`
            : `Score unchanged between scans. ${stillMissingSkills.length > 0 ? `Top gaps to close: ${stillMissingSkills.slice(0, 3).join(', ')}.` : 'Keep up the strong work!'}`;
    return {
        base,
        compare,
        deltaPercent,
        scoreDeltas,
        newlyMatchedSkills,
        skillsLost,
        stillMissingSkills,
        improvedSkillCount,
        insight,
    };
}
//# sourceMappingURL=compare.service.js.map