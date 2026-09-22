"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRetryingClient = createRetryingClient;
const axios_1 = __importDefault(require("axios"));
function createRetryingClient(baseConfig = {}) {
    const client = axios_1.default.create({ timeout: 15000, ...baseConfig });
    client.interceptors.response.use((response) => response, async (error) => {
        const config = error.config;
        if (!config)
            return Promise.reject(error);
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
    });
    return client;
}
//# sourceMappingURL=httpClient.js.map