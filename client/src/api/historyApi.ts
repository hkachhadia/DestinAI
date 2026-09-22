import { httpClient, unwrap } from './axiosClient';
import { mockHistory } from './mocks';
import type { ApiEnvelope, HistoryEntry, HistoryListResponse } from '@/types/api';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export async function fetchHistory(page = 1, limit = 20): Promise<HistoryListResponse> {
  if (useMocks) { const mocked = { entries: mockHistory, total: Array.isArray(mockHistory) ? mockHistory.length : 0 }; return Promise.resolve(mocked as unknown as HistoryListResponse); }
  return unwrap(
    httpClient.get<ApiEnvelope<HistoryListResponse>>(`/score/history?page=${page}&limit=${limit}`)
  );
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await unwrap(httpClient.delete<ApiEnvelope<{ deleted: number }>>(`/history/${id}`));
}

export async function deleteHistoryBatch(ids: string[]): Promise<{ deleted: number; total: number }> {
  return unwrap(httpClient.delete<ApiEnvelope<{ deleted: number; total: number }>>('/history/batch', { data: { ids } }));
}

export async function deleteAllHistory(): Promise<{ deletedCount: number }> {
  return unwrap(httpClient.delete<ApiEnvelope<{ deletedCount: number }>>('/history/all'));
}
