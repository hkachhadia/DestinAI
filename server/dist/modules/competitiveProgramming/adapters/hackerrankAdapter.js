"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hackerrankAdapter = void 0;
const httpClient_1 = require("../../../utils/httpClient");
const ApiError_1 = require("../../../utils/ApiError");
const client = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://www.hackerrank.com/rest',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0; +https://destinai.app)' },
});
function bucketByStars(stars) {
    if (stars <= 2)
        return 'easy';
    if (stars <= 4)
        return 'medium';
    return 'hard';
}
/** HackerRank has no official public API for third-party profile lookups.
 * This uses the unofficial REST endpoints HackerRank's own profile page
 * calls client-side. Isolated behind CPAdapter for the same reason as the
 * CodeChef/GfG adapters — a platform change only requires editing this file. */
exports.hackerrankAdapter = {
    async fetchProfile(handle) {
        let profile;
        let badgesResponse;
        try {
            const [profileRes, badgesRes] = await Promise.all([
                client.get(`/contests/master/hackers/${handle}/profile`, { validateStatus: () => true }),
                client.get(`/hackers/${handle}/badges`, { validateStatus: () => true }),
            ]);
            if (profileRes.status === 404 || !profileRes.data?.model) {
                throw new ApiError_1.ApiError(404, `HackerRank user "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
            }
            profile = profileRes.data;
            badgesResponse = badgesRes.status === 200 ? badgesRes.data : { models: [] };
        }
        catch (err) {
            if (err instanceof ApiError_1.ApiError)
                throw err;
            throw new ApiError_1.ApiError(502, 'Failed to reach HackerRank', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        const badges = badgesResponse.models ?? [];
        const buckets = { easy: 0, medium: 0, hard: 0 };
        let totalSolved = 0;
        for (const badge of badges) {
            const solvedForBadge = badge.solved ?? 0;
            buckets[bucketByStars(badge.stars)] += solvedForBadge;
            totalSolved += solvedForBadge;
        }
        return {
            rating: badges.reduce((sum, b) => sum + b.stars, 0),
            maxRating: badges.reduce((sum, b) => sum + b.stars, 0),
            rank: profile.model?.country ? `${badges.length} badges — ${profile.model.country}` : `${badges.length} badges`,
            problemsSolved: { ...buckets, total: totalSolved },
            contestsAttended: 0, // not exposed by these endpoints
            badges: badges.map((b) => b.badge_name),
        };
    },
};
//# sourceMappingURL=hackerrankAdapter.js.map