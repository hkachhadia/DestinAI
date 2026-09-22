import { createRetryingClient } from '../../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import type { ICPStats } from '../cp.model';
import type { CPAdapter } from './types';

const client = createRetryingClient({ baseURL: 'https://codeforces.com/api' });

interface CFUserInfoResponse {
  status: 'OK' | 'FAILED';
  comment?: string;
  result?: { handle: string; rating?: number; maxRating?: number; rank?: string }[];
}

interface CFRatingHistoryResponse {
  status: 'OK' | 'FAILED';
  result?: unknown[];
}

interface CFSubmission {
  verdict?: string;
  problem: { rating?: number };
}

interface CFStatusResponse {
  status: 'OK' | 'FAILED';
  result?: CFSubmission[];
}

function bucketDifficulty(rating: number | undefined): 'easy' | 'medium' | 'hard' {
  if (!rating || rating < 1300) return 'easy';
  if (rating < 1900) return 'medium';
  return 'hard';
}

/** Codeforces is the one platform in this module with a genuine official,
 * documented public API — no scraping or undocumented endpoints needed. */
export const codeforcesAdapter: CPAdapter = {
  async fetchProfile(handle: string): Promise<ICPStats> {
    let userInfo: CFUserInfoResponse;
    try {
      const { data } = await client.get<CFUserInfoResponse>('/user.info', { params: { handles: handle } });
      userInfo = data;
    } catch {
      throw new ApiError(502, 'Failed to reach Codeforces', ErrorCodes.CP_SYNC_FAILED);
    }

    if (userInfo.status !== 'OK' || !userInfo.result?.length) {
      throw new ApiError(404, `Codeforces handle "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
    }
    const user = userInfo.result[0];

    const [ratingHistory, submissions] = await Promise.all([
      client
        .get<CFRatingHistoryResponse>('/user.rating', { params: { handle } })
        .then((r) => r.data.result ?? [])
        .catch(() => []),
      client
        .get<CFStatusResponse>('/user.status', { params: { handle, from: 1, count: 10000 } })
        .then((r) => r.data.result ?? [])
        .catch(() => []),
    ]);

    const solvedProblemKeys = new Set<string>();
    const buckets = { easy: 0, medium: 0, hard: 0 };
    for (const sub of submissions) {
      if (sub.verdict !== 'OK') continue;
      const key = JSON.stringify(sub.problem);
      if (solvedProblemKeys.has(key)) continue;
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
