// Merged: client-1 basic score fetch + client-2 comprehensive score API
import { axiosClient } from './axiosClient';
import type { ApiResponse } from '@/contracts/api-response.types';
import type { Score } from '@/contracts/score.types';
import type { ScoreOverview } from '@/types/api';

export const scoreApi = {
  // Client-1: basic single score fetch (used by onboarding dashboard mini-card)
  async getMine(): Promise<Score | null> {
    const { data } = await axiosClient.get<ApiResponse<Score | null>>('/score/me');
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // Client-2: full score overview (drives Dashboard rings, Analytics charts)
  async getOverview(): Promise<ScoreOverview> {
    const { data } = await axiosClient.get<ApiResponse<ScoreOverview>>('/score/overview');
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async recompute(): Promise<ScoreOverview> {
    const { data } = await axiosClient.post<ApiResponse<ScoreOverview>>('/score/recompute');
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getHistory(page = 1, limit = 20) {
    const { data } = await axiosClient.get<ApiResponse<{ entries: unknown[]; total: number }>>(
      `/score/history?page=${page}&limit=${limit}`
    );
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getComparison(baseId: string, compareId: string) {
    const { data } = await axiosClient.get<ApiResponse<unknown>>(
      `/score/comparison?baseId=${encodeURIComponent(baseId)}&compareId=${encodeURIComponent(compareId)}`
    );
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};

// ── Client-2 hook aliases ────────────────────────────────────────────────────
export const fetchScoreOverview = scoreApi.getOverview;
export const recomputeScore = scoreApi.recompute;
export const fetchHistory = scoreApi.getHistory;
export const fetchComparison = scoreApi.getComparison;
