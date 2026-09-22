"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leetcodeAdapter = void 0;
const httpClient_1 = require("../../../utils/httpClient");
const ApiError_1 = require("../../../utils/ApiError");
const client = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://leetcode.com',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com',
    },
    timeout: 15000,
});
const PROFILE_QUERY = `
  query userProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum { difficulty count }
      }
      profile { ranking }
    }
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
    }
  }
`;
exports.leetcodeAdapter = {
    async fetchProfile(handle) {
        let response;
        try {
            response = await client.post('/graphql', {
                query: PROFILE_QUERY,
                variables: { username: handle },
            });
        }
        catch (err) {
            throw new ApiError_1.ApiError(502, `Failed to reach LeetCode: ${err.message}`, ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        if (!response.data?.data) {
            throw new ApiError_1.ApiError(502, 'LeetCode returned an invalid response', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        const { matchedUser, userContestRanking } = response.data.data;
        if (!matchedUser) {
            throw new ApiError_1.ApiError(404, `LeetCode user "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
        }
        const counts = Object.fromEntries(matchedUser.submitStatsGlobal.acSubmissionNum.map((s) => [s.difficulty, s.count]));
        return {
            rating: userContestRanking?.rating ? Math.round(userContestRanking.rating) : 0,
            maxRating: userContestRanking?.rating ? Math.round(userContestRanking.rating) : 0,
            rank: matchedUser.profile.ranking ? `Global Rank #${matchedUser.profile.ranking}` : '',
            problemsSolved: {
                easy: counts.Easy ?? 0,
                medium: counts.Medium ?? 0,
                hard: counts.Hard ?? 0,
                total: counts.All ?? 0,
            },
            contestsAttended: userContestRanking?.attendedContestsCount ?? 0,
            badges: [],
        };
    },
};
//# sourceMappingURL=leetcodeAdapter.js.map