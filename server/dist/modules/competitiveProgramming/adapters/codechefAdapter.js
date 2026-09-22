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
exports.codechefAdapter = void 0;
const cheerio = __importStar(require("cheerio"));
const httpClient_1 = require("../../../utils/httpClient");
const ApiError_1 = require("../../../utils/ApiError");
const client = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://www.codechef.com',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DestinAI/1.0; +https://destinai.app)' },
});
/** CodeChef publishes no public API for arbitrary user profiles, so this
 * scrapes the public profile page. This is the most fragile adapter in the
 * module by nature of the platform, not the implementation — isolated
 * entirely behind the CPAdapter interface so it can be swapped for an
 * official API the moment CodeChef offers one, with zero changes anywhere
 * else in the CP module. */
exports.codechefAdapter = {
    async fetchProfile(handle) {
        let html;
        try {
            const { data, status } = await client.get(`/users/${handle}`, {
                responseType: 'text',
                validateStatus: () => true,
            });
            if (status === 404)
                throw new ApiError_1.ApiError(404, `CodeChef user "${handle}" not found`, ApiError_1.ErrorCodes.CP_HANDLE_NOT_FOUND);
            html = data;
        }
        catch (err) {
            if (err instanceof ApiError_1.ApiError)
                throw err;
            throw new ApiError_1.ApiError(502, 'Failed to reach CodeChef', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        const $ = cheerio.load(html);
        const ratingText = $('.rating-number').first().text().trim();
        const rating = parseInt(ratingText, 10) || 0;
        const starText = $('.rating-star').first().text().trim(); // e.g. "5★"
        const rank = starText || $('.rating-header .rating-star').text().trim();
        const highestRatingText = $('.rating-header small')
            .filter((_, el) => $(el).text().includes('Highest Rating'))
            .text();
        const highestRatingMatch = highestRatingText.match(/\d+/);
        const maxRating = highestRatingMatch ? parseInt(highestRatingMatch[0], 10) : rating;
        const contestsText = $('.contest-participated-count b').first().text().trim();
        const contestsAttended = parseInt(contestsText, 10) || 0;
        const fullySolvedText = $('.problems-solved h5')
            .filter((_, el) => $(el).text().toLowerCase().includes('fully solved'))
            .parent()
            .find('a')
            .toArray().length;
        if (!rating && !ratingText && !rank) {
            // Page loaded but none of the expected DOM nodes were found — most
            // likely CodeChef changed their markup, not that the handle is invalid.
            throw new ApiError_1.ApiError(502, 'Unable to parse CodeChef profile — page structure may have changed', ApiError_1.ErrorCodes.CP_SYNC_FAILED);
        }
        return {
            rating,
            maxRating,
            rank,
            problemsSolved: { easy: 0, medium: 0, hard: 0, total: fullySolvedText },
            contestsAttended,
            badges: [],
        };
    },
};
//# sourceMappingURL=codechefAdapter.js.map