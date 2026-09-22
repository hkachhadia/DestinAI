import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/utils/env';

const ACCESS_TOKEN_KEY = 'destinai_access_token';

export interface NormalizedApiError {
  message: string;
  code: string;
  status: number;
}

export const axiosClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processPending(err: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)));
  pendingQueue = [];
}

// On 401 — try refreshing the token exactly once, then replay queued calls
axiosClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return axiosClient(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Refresh token is sent as httpOnly cookie automatically
      const { data } = await axios.post(`${env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
      const newToken: string = data.data.accessToken;
      localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
      processPending(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      processPending(refreshError, null);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new Event('destinai:session-expired'));
      return Promise.reject(
        normalizeError(refreshError as AxiosError<{ message?: string; error?: { code?: string } }>)
      );
    } finally {
      isRefreshing = false;
    }
  }
);

function normalizeError(err: AxiosError): NormalizedApiError {
  const data = err.response?.data as { message?: string; error?: { code?: string } } | undefined;
  return {
    message: data?.message ?? err.message ?? 'An unexpected error occurred',
    code: data?.error?.code ?? 'UNKNOWN_ERROR',
    status: err.response?.status ?? 0,
  };
}

export { ACCESS_TOKEN_KEY };

// ── Client-2 compatibility exports ──────────────────────────────────────────
// Client-2 API files import { httpClient, unwrap } from './axiosClient'
// httpClient = the axios instance; unwrap = extracts the data payload.

export const httpClient = axiosClient;

export async function unwrap<T>(
  promise: Promise<{ data: { success: boolean; data: T | null; message?: string; error?: { code: string; message: string } | null } }>
): Promise<T> {
  const { data } = await promise;
  if (!data.success || data.data === null || data.data === undefined) {
    const msg = data.error?.message ?? (data as { message?: string }).message ?? 'Request failed';
    throw new Error(msg);
  }
  return data.data;
}
