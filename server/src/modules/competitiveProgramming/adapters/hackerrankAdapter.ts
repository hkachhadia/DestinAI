import { createRetryingClient } from '../../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import type { ICPStats } from '../cp.model';
import type { CPAdapter } from './types';

const client = createRetryingClient({
  baseURL: 'https://www.hackerrank.com/rest',
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0; +https://destinai.app)' },
});

interface HRProfileResponse {
  model?: {
    name?: string;
    country?: string;
  };
}

interface HRBadge {
  badge_name: string;
  stars: number;
  solved?: number;
}

interface HRBadgesResponse {
  models?: HRBadge[];
}

function bucketByStars(stars: number): 'easy' | 'medium' | 'hard' {
  if (stars <= 2) return 'easy';
  if (stars <= 4) return 'medium';
  return 'hard';
}

/** HackerRank has no official public API for third-party profile lookups.
 * This uses the unofficial REST endpoints HackerRank's own profile page
 * calls client-side. Isolated behind CPAdapter for the same reason as the
 * CodeChef/GfG adapters — a platform change only requires editing this file. */
export const hackerrankAdapter: CPAdapter = {
  async fetchProfile(handle: string): Promise<ICPStats> {
    let profile: HRProfileResponse;
    let badgesResponse: HRBadgesResponse;

    try {
      const [profileRes, badgesRes] = await Promise.all([
        client.get<HRProfileResponse>(`/contests/master/hackers/${handle}/profile`, { validateStatus: () => true }),
        client.get<HRBadgesResponse>(`/hackers/${handle}/badges`, { validateStatus: () => true }),
      ]);

      if (profileRes.status === 404 || !profileRes.data?.model) {
        throw new ApiError(404, `HackerRank user "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
      }
      profile = profileRes.data;
      badgesResponse = badgesRes.status === 200 ? badgesRes.data : { models: [] };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, 'Failed to reach HackerRank', ErrorCodes.CP_SYNC_FAILED);
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
