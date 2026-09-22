import type { ICPStats } from '../cp.model';

export interface CPAdapter {
  /** Throws ApiError(CP_HANDLE_NOT_FOUND) if the handle doesn't exist,
   * or ApiError(CP_SYNC_FAILED) on any other fetch/parse failure. */
  fetchProfile(handle: string): Promise<ICPStats>;
}

export function emptyStats(): ICPStats {
  return { rating: 0, maxRating: 0, rank: '', problemsSolved: { easy: 0, medium: 0, hard: 0, total: 0 }, contestsAttended: 0, badges: [] };
}
