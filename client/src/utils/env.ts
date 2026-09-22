export const env = {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1',
  VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS === 'true',
};
