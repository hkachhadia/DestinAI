import { httpClient, unwrap } from './axiosClient';
import { mockSettings } from './mocks';
import type { ApiEnvelope, UserSettings } from '@/types/api';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

/** GET /users/me/settings */
export async function fetchSettings(): Promise<UserSettings> {
  if (useMocks) return Promise.resolve(mockSettings);
  return unwrap(httpClient.get<ApiEnvelope<UserSettings>>('/users/me/settings'));
}

/** PATCH /users/me/settings */
export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  if (useMocks) return Promise.resolve({ ...mockSettings, ...patch } as UserSettings);
  return unwrap(httpClient.patch<ApiEnvelope<UserSettings>>('/users/me/settings', patch));
}
