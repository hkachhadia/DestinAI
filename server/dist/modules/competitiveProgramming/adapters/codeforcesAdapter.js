"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codeforcesAdapter = void 0;
const httpClient_1 = require("../../../utils/httpClient");
const ApiError_1 = require("../../../utils/ApiError");
const client = (0, httpClient_1.createRetryingClient)({ baseURL: 'https://codeforces.com/api' });
function bucketDifficulty(rating) {
    if (!rating || rating < 1300)
        return 'easy';
    if (rating < 1900)
        return 'medium';
    return 'hard';
}
/** Codeforces is the one platform in this module with a genuine official,
 * documented public API — no scraping or undocumented endpoints needed. */
exports.codeforcesAdapter = {
    async fetchProfile(handle) {
        let userInfo;
        try {
            const { data } = await client.get('/user.info', { params: { handles: handle } });
            userInfo = data;
        }
        catch {
            throw new ApiError_1.ApiError(502, 'Failed to reach Codeforces', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        if (userInfo.status !== 'OK' || !userInfo.result?.length) {
            throw new ApiError_1.ApiError(404, `Codeforces handle "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
        }
        const user = userInfo.result[0];
        const [ratingHistory, submissions] = await Promise.all([
            client
                .get('/user.rating', { params: { handle } })
                .then((r) => r.data.result ?? [])
                .catch(() => []),
            client
                .get('/user.status', { params: { handle, from: 1, count: 10000 } })
                .then((r) => r.data.result ?? [])
                .catch(() => []),
        ]);
        const solvedProblemKeys = new Set();
        const buckets = { easy: 0, medium: 0, hard: 0 };
        for (const sub of submissions) {
            if (sub.verdict !== 'OK')
                continue;
            const key = JSON.stringify(sub.problem);
            if (solvedProblemKeys.has(key))
                continue;
            solvedProblemKeys.add(key);
            buckets[bucketDifficulty(sub.problem.rating)] += 1;
        }
        return {
            rating: user.rating ?? 0,
            maxRating: user.maxRating ?? user.rating ?? 0,
            rank: user.rank ?? '',
            problemsSolved: { ...buckets, total: solvedProblemKeys.size },
            contestsAttended: ratingHistory.length,
            badges: [],
        };
    },
};
//# sourceMappingURL=codeforcesAdapter.js.map