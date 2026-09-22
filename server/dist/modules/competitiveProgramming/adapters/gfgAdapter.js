"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.gfgAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
const httpClient_1 = require("../../../utils/httpClient");
const ApiError_1 = require("../../../utils/ApiError");
// GFG's practice API endpoint (used by their own frontend)
const apiClient = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://practiceapi.geeksforgeeks.org/api/v1',
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0)',
        'Accept': 'application/json',
    },
    timeout: 15000,
});
// Fallback: scrape the public profile page
const webClient = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://auth.geeksforgeeks.org',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
    },
    timeout: 20000,
});
exports.gfgAdapter = {
    async fetchProfile(handle) {
        // Try the API first
        try {
            const { data, status } = await apiClient.get(`/user/${handle}/profile/`, {
                validateStatus: () => true,
            });
            if (status === 200 && data?.info) {
                const solved = data.solved_stats ?? {};
                const easy = (solved.easy?.count ?? 0) + (solved.basic?.count ?? 0) + (solved.school?.count ?? 0);
                const medium = solved.medium?.count ?? 0;
                const hard = solved.hard?.count ?? 0;
                const total = data.info.total_problems_solved ?? (easy + medium + hard);
                return {
                    rating: data.info.coding_score ?? 0,
                    maxRating: data.info.coding_score ?? 0,
                    rank: data.info.institute_rank ? `Institute Rank #${data.info.institute_rank}` : '',
                    problemsSolved: { easy, medium, hard, total },
                    contestsAttended: 0,
                    badges: [],
                };
            }
            if (status === 404) {
                throw new ApiError_1.ApiError(404, `GeeksforGeeks user "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
            }
        }
        catch (err) {
            if (err instanceof ApiError_1.ApiError)
                throw err;
            // API failed — try scraping the public profile page
        }
        // Fallback: scrape user profile page
        try {
            const { data: html, status } = await webClient.get(`/user/${handle}`, {
                responseType: 'text',
                validateStatus: () => true,
            });
            if (status === 404) {
                throw new ApiError_1.ApiError(404, `GeeksforGeeks user "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
            }
            const $ = cheerio.load(html);
            const totalSolved = parseInt($('.scoreCard_head_left--score__oSi_x').first().text().trim(), 10)
                || parseInt($('[class*="score"]').first().text().trim(), 10)
                || 0;
            const codingScore = parseInt($('[class*="codingScore"], [class*="coding_score"]').first().text().trim(), 10) || 0;
            return {
                rating: codingScore,
                maxRating: codingScore,
                rank: '',
                problemsSolved: { easy: 0, medium: 0, hard: 0, total: totalSolved },
                contestsAttended: 0,
                badges: [],
            };
        }
        catch (err) {
            if (err instanceof ApiError_1.ApiError)
                throw err;
            throw new ApiError_1.ApiError(502, 'Failed to reach GeeksforGeeks', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
    },
};
//# sourceMappingURL=gfgAdapter.js.map