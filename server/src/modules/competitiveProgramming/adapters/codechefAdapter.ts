import * as cheerio from 'cheerio';
import { createRetryingClient } from '../../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import type { ICPStats } from '../cp.model';
import type { CPAdapter } from './types';

const client = createRetryingClient({
  baseURL: 'https://www.codechef.com',
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0; +https://destinai.app)' },
});

/** CodeChef publishes no public API for arbitrary user profiles, so this
 * scrapes the public profile page. This is the most fragile adapter in the
 * module by nature of the platform, not the implementation — isolated
 * entirely behind the CPAdapter interface so it can be swapped for an
 * official API the moment CodeChef offers one, with zero changes anywhere
 * else in the CP module. */
export const codechefAdapter: CPAdapter = {
  async fetchProfile(handle: string): Promise<ICPStats> {
    let html: string;
    try {
      const { data, status } = await client.get<string>(`/users/${handle}`, {
        responseType: 'text',
        validateStatus: () => true,
      });
      if (status === 404) throw new ApiError(404, `CodeChef user "${handle}" not found`, ErrorCodes.CP_HANDLE_NOT_FOUND);
      html = data;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(502, 'Failed to reach CodeChef', ErrorCodes.CP_SYNC_FAILED);
    }

    const $ = cheerio.load(html);

    const ratingText = $('.rating-number').first().text().trim();
    const rating = parseInt(ratingText, 10) || 0;

    const starText = $('.rating-star').first().text().trim(); // e.g. "5★"
    const rank = starText || $('.rating-header .rating-star').text().trim();

    const highestRatingText = $('.rating-header small')
      .filter((_, el) => $(el).text().includes('Highest Rating'))
      .text();
    const highestRatingMatch = highestRatingText.match(/\d+/);
    const maxRating = highestRatingMatch ? parseInt(highestRatingMatch[0], 10) : rating;

    const contestsText = $('.contest-participated-count b').first().text().trim();
    const contestsAttended = parseInt(contestsText, 10) || 0;

    const fullySolvedText = $('.problems-solved h5')
      .filter((_, el) => $(el).text().toLowerCase().includes('fully solved'))
      .parent()
      .find('a')
      .toArray().length;

    if (!rating && !ratingText && !rank) {
      // Page loaded but none of the expected DOM nodes were found — most
      // likely CodeChef changed their markup, not that the handle is invalid.
      throw new ApiError(502, 'Unable to parse CodeChef profile — page structure may have changed', ErrorCodes.CP_SYNC_FAILED);
    }

    return {
      rating,
      maxRating,
      rank,
      problemsSolved: { easy: 0, medium: 0, hard: 0, total: fullySolvedText },
      contestsAttended,
      badges: [],
    };
  },
};
