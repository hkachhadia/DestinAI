import axios, { AxiosInstance, AxiosError } from 'axios';

export function createRetryingClient(baseConfig: Parameters<typeof axios.create>[0] = {}): AxiosInstance {
  const client = axios.create({ timeout: 15000, ...baseConfig });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as (AxiosError['config'] & { __retryCount?: number }) | undefined;
      if (!config) return Promise.reject(error);

      const status = error.response?.status;
      const isRetryable = !status || status === 429 || status >= 500;
      config.__retryCount = config.__retryCount ?? 0;

      if (isRetryable && config.__retryCount < 3) {
        config.__retryCount += 1;
        const delayMs = 300 * 2 ** config.__retryCount; // exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return client(config);
      }

      return Promise.reject(error);
    }
  );

  return client;
}
