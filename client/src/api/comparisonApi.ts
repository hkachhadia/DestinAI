import { httpClient, unwrap } from './axiosClient';
import { mockComparison } from './mocks';
import type { ApiEnvelope, ComparisonResult } from '@/types/api';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

/** GET /score/comparison?baseId=&compareId= — side-by-side diff between two
 * historical snapshots (or a snapshot vs the latest analysis). */
export async function fetchComparison(baseId: string, compareId: string): Promise<ComparisonResult> {
  if (useMocks) return Promise.resolve(mockComparison);
  return unwrap(
    httpClient.get<ApiEnvelope<ComparisonResult>>('/score/comparison', { params: { baseId, compareId } })
  );
}
