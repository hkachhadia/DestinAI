import { createRetryingClient } from '../../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import type { ICPStats } from '../cp.model';
import type { CPAdapter } from './types';

const client = createRetryingClient({
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

interface LeetCodeResponse {
  data: {
    matchedUser: {
      submitStatsGlobal: { acSubmissionNum: { difficulty: 'All' | 'Easy' | 'Medium' | 'Hard'; count: number }[] };
      profile: { ranking: number };
    } | null;
    userContestRanking: { rating: number; attendedContestsCount: number } | null;
  };
}

export const leetcodeAdapter: CPAdapter = {
  async fetchProfile(handle: string): Promise<ICPStats> {
    let response;
    try {
      response = await client.post<LeetCodeResponse>('/graphql', {
        query: PROFILE_QUERY,
        variables: { username: handle },
      });
    } catch (err) {
      throw new ApiError(502, `Failed to reach LeetCode: ${(err as Error).message}`, ErrorCodes.CP_SYNC_FAILED);
    }

    if (!response.data?.data) {
      throw new ApiError(502, 'LeetCode returned an invalid response', ErrorCodes.CP_SYNC_FAILED);
    }

    const { matchedUser, userContestRanking } = response.data.data;
    if (!matchedUser) {
      throw new ApiError(404, `LeetCode user "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
    }

    const counts = Object.fromEntries(
      matchedUser.submitStatsGlobal.acSubmissionNum.map((s) => [s.difficulty, s.count])
    );

    return {
      rating: userContestRanking?.rating ? Math.round(userContestRanking.rating) : 0,
      maxRating: userContestRanking?.rating ? Math.round(userContestRanking.rating) : 0,
      rank: matchedUser.profile.ranking ? `Global Rank #${matchedUser.profile.ranking}` : '',
      problemsSolved: {
        easy:   counts.Easy   ?? 0,
        medium: counts.Medium ?? 0,
        hard:   counts.Hard   ?? 0,
        total:  counts.All    ?? 0,
      },
      contestsAttended: userContestRanking?.attendedContestsCount ?? 0,
      badges: [],
    };
  },
};
