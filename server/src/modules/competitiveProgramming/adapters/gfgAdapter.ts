import * as cheerio from 'cheerio';
import { createRetryingClient } from '../../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import type { ICPStats } from '../cp.model';
import type { CPAdapter } from './types';

// GFG's practice API endpoint (used by their own frontend)
const apiClient = createRetryingClient({
  baseURL: 'https://practiceapi.geeksforgeeks.org/api/v1',
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0)',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Fallback: scrape the public profile page
const webClient = createRetryingClient({
  baseURL: 'https://auth.geeksforgeeks.org',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
  },
  timeout: 20000,
});

interface GfgApiResponse {
  info?: {
    coding_score?: number;
    institute_rank?: number;
    current_streak?: number;
    max_streak?: number;
    total_problems_solved?: number;
  };
  solved_stats?: Record<string, { count?: number }>;
}

export const gfgAdapter: CPAdapter = {
  async fetchProfile(handle: string): Promise<ICPStats> {
    // Try the API first
    try {
      const { data, status } = await apiClient.get<GfgApiResponse>(`/user/${handle}/profile/`, {
        validateStatus: () => true,
      });

      if (status === 200 && data?.info) {
        const solved = data.solved_stats ?? {};
        const easy   = (solved.easy?.count ?? 0) + (solved.basic?.count ?? 0) + (solved.school?.count ?? 0);
        const medium = solved.medium?.count ?? 0;
        const hard   = solved.hard?.count ?? 0;
        const total  = data.info.total_problems_solved ?? (easy + medium + hard);

        return {
          rating: data.info.coding_score ?? 0,
          maxRating: data.info.coding_score ?? 0,
          rank: data.info.institute_rank ? `Institute Rank #${data.info.institute_rank}` : '',
          problemsSolved: { easy, medium, hard, total },
          contestsAttended: 0,
          badges: [],
        };
      }

      if (status === 404) {
        throw new ApiError(404, `GeeksforGeeks user "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // API failed — try scraping the public profile page
    }

    // Fallback: scrape user profile page
    try {
      const { data: html, status } = await webClient.get<string>(`/user/${handle}`, {
        responseType: 'text',
        validateStatus: () => true,
      });
      if (status === 404) {
        throw new ApiError(404, `GeeksforGeeks user "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
      }

      const $ = cheerio.load(html);
      const totalSolved = parseInt($('.scoreCard_head_left--score__oSi_x').first().text().trim(), 10)
        || parseInt($('[class*="score"]').first().text().trim(), 10)
        || 0;
      const codingScore = parseInt(
        $('[class*="codingScore"], [class*="coding_score"]').first().text().trim(), 10
      ) || 0;

      return {
        rating: codingScore,
        maxRating: codingScore,
        rank: '',
        problemsSolved: { easy: 0, medium: 0, hard: 0, total: totalSolved },
        contestsAttended: 0,
        badges: [],
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, 'Failed to reach GeeksforGeeks', ErrorCodes.CP_SYNC_FAILED);
    }
  },
};
