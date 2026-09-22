"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectGitHub = connectGitHub;
exports.syncGitHubProfile = syncGitHubProfile;
exports.getGitHubProfile = getGitHubProfile;
const mongoose_1 = require("mongoose");
const httpClient_1 = require("../../utils/httpClient");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
const env_1 = require("../../config/env");
const github_model_1 = require("./github.model");
const githubClient = (0, httpClient_1.createRetryingClient)({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github+json',
        ...(env_1.env.GITHUB_API_TOKEN
            ? {
                Authorization: `Bearer ${env_1.env.GITHUB_API_TOKEN}`,
            }
            : {}),
    },
});
/**
 * Fetch a GitHub user profile.
 */
async function fetchGitHubUser(username) {
    try {
        const { data } = await githubClient.get(`/users/${encodeURIComponent(username)}`);
        return data;
    }
    catch (err) {
        handleGithubError(err);
        throw err;
    }
}
/**
 * Fetch public repositories for a GitHub user.
 */
async function fetchGitHubRepos(username) {
    try {
        const { data } = await githubClient.get(`/users/${encodeURIComponent(username)}/repos`, {
            params: {
                per_page: 100,
                sort: 'updated',
            },
        });
        return data;
    }
    catch (err) {
        handleGithubError(err);
        throw err;
    }
}
/**
 * GitHub's REST API does not provide a single endpoint for
 * "commits in the last year" for a user.
 *
 * We therefore use GraphQL's contributionsCollection.
 *
 * If the token is not configured, we return 0 because the
 * contribution calendar requires authenticated GraphQL access.
 */
async function fetchCommitsLastYear(username) {
    if (!env_1.env.GITHUB_API_TOKEN) {
        logger_1.logger.warn('[GITHUB] GITHUB_API_TOKEN is not configured');
        return 0;
    }
    const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }
  `;
    try {
        const { data } = await githubClient.post('/graphql', {
            query,
            variables: {
                login: username,
            },
        });
        if (data.errors?.length) {
            logger_1.logger.warn('[GITHUB] GraphQL returned errors', {
                username,
                errors: data.errors,
            });
            return 0;
        }
        return (data.data?.user?.contributionsCollection?.contributionCalendar
            ?.totalContributions ?? 0);
    }
    catch (err) {
        const error = err;
        logger_1.logger.warn('[GITHUB] GraphQL contribution request failed', {
            username,
            status: error.response?.status,
            message: error.response?.data?.message ||
                error.message ||
                'Unknown GitHub GraphQL error',
        });
        /*
         * Contribution count is only one scoring signal.
         * A GraphQL failure should not prevent the rest of the
         * GitHub profile from being synchronized.
         */
        return 0;
    }
}
/**
 * Convert GitHub API errors into application errors while
 * preserving enough information in logs to diagnose the
 * actual problem.
 */
function handleGithubError(err) {
    const error = err;
    const status = error.response?.status;
    const message = error.response?.data?.message ||
        error.message ||
        'Unknown GitHub API error';
    const documentationUrl = error.response?.data?.documentation_url;
    logger_1.logger.error('[GITHUB_API_ERROR]', {
        status,
        message,
        documentationUrl,
    });
    /*
     * 401 = authentication failure.
     *
     * Usually means:
     * - invalid token
     * - expired/revoked token
     * - malformed Authorization header
     */
    if (status === 401) {
        throw new ApiError_1.ApiError(502, 'GitHub authentication failed. Check GITHUB_API_TOKEN.', ApiError_1.ErrorCodes.GITHUB_SYNC_FAILED);
    }
    /*
     * 404 = username/resource does not exist.
     */
    if (status === 404) {
        throw new ApiError_1.ApiError(404, 'GitHub username not found', ApiError_1.ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
    }
    /*
     * 403 / 429 can indicate:
     * - rate limiting
     * - permission restrictions
     * - GitHub API access restrictions
     */
    if (status === 403 || status === 429) {
        throw new ApiError_1.ApiError(429, `GitHub API access/rate limit error: ${message}`, ApiError_1.ErrorCodes.GITHUB_RATE_LIMITED);
    }
    /*
     * Everything else becomes a GitHub synchronization error,
     * but the real GitHub error is preserved in Render logs.
     */
    throw new ApiError_1.ApiError(502, `GitHub API error: ${message}`, ApiError_1.ErrorCodes.GITHUB_SYNC_FAILED);
}
/**
 * Calculate language distribution from non-fork repositories.
 */
function computeTopLanguages(repos) {
    const counts = {};
    for (const repo of repos) {
        if (!repo.language || repo.fork) {
            continue;
        }
        counts[repo.language] =
            (counts[repo.language] ?? 0) + 1;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
        .map(([language, count]) => ({
        language,
        percentage: Math.round((count / total) * 100),
    }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 8);
}
/**
 * Select the most relevant repositories for display.
 *
 * Forks are excluded and repositories are ordered by stars.
 */
function computePinnedRepos(repos) {
    return repos
        .filter((repo) => !repo.fork)
        .sort((a, b) => b.stargazers_count -
        a.stargazers_count)
        .slice(0, 6)
        .map((repo) => ({
        name: repo.name,
        description: repo.description ?? '',
        stars: repo.stargazers_count,
        language: repo.language,
        url: repo.html_url,
    }));
}
/**
 * Connect a GitHub username to a DestinAI user.
 *
 * IMPORTANT:
 * The complete synchronization is now required to succeed.
 * We no longer silently return a partial profile when sync fails.
 */
async function connectGitHub(userId, username) {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
        throw new ApiError_1.ApiError(400, 'GitHub username is required', ApiError_1.ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
    }
    /*
     * First verify that the GitHub username exists.
     */
    const user = await fetchGitHubUser(normalizedUsername);
    /*
     * Create/update the profile with basic information.
     *
     * The full sync immediately below will replace these
     * temporary values with complete GitHub statistics.
     */
    await github_model_1.GitHubProfile.findOneAndUpdate({
        userId: new mongoose_1.Types.ObjectId(userId),
    }, {
        userId: new mongoose_1.Types.ObjectId(userId),
        username: normalizedUsername,
        stats: {
            publicRepos: user.public_repos,
            followers: user.followers,
            totalStars: 0,
            totalCommitsLastYear: 0,
            topLanguages: [],
            pinnedRepos: [],
            accountCreatedAt: user.created_at,
        },
    }, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
    });
    /*
     * Perform the full synchronization.
     *
     * IMPORTANT:
     * Do NOT swallow this error.
     *
     * If GitHub synchronization fails, the caller needs to
     * know about it rather than treating a partial profile
     * as a successful GitHub connection.
     */
    return await syncGitHubProfile(userId);
}
/**
 * Fully synchronize the GitHub profile for a DestinAI user.
 */
async function syncGitHubProfile(userId) {
    const existing = await github_model_1.GitHubProfile.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!existing) {
        throw new ApiError_1.ApiError(404, 'Connect a GitHub account first', ApiError_1.ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
    }
    const username = existing.username;
    logger_1.logger.info('[GITHUB] Starting profile sync', {
        userId,
        username,
    });
    /*
     * Fetch user profile and repositories in parallel.
     */
    const [user, repos] = await Promise.all([
        fetchGitHubUser(username),
        fetchGitHubRepos(username),
    ]);
    /*
     * Calculate total stars from repositories.
     */
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    /*
     * Contributions are fetched separately because they
     * require GraphQL authentication.
     */
    const commitsLastYear = await fetchCommitsLastYear(username);
    /*
     * Update all synchronized statistics.
     */
    existing.stats = {
        publicRepos: user.public_repos,
        followers: user.followers,
        totalStars,
        totalCommitsLastYear: commitsLastYear,
        topLanguages: computeTopLanguages(repos),
        pinnedRepos: computePinnedRepos(repos),
        accountCreatedAt: user.created_at,
    };
    existing.lastSyncedAt = new Date();
    await existing.save();
    logger_1.logger.info('[GITHUB] Profile sync successful', {
        userId,
        username,
        publicRepos: user.public_repos,
        followers: user.followers,
        totalStars,
        commitsLastYear,
        repositoryCountFetched: repos.length,
        topLanguages: existing.stats.topLanguages.map((language) => language.language),
    });
    return existing;
}
/**
 * Retrieve the currently stored GitHub profile.
 */
async function getGitHubProfile(userId) {
    return github_model_1.GitHubProfile.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
    });
}
//# sourceMappingURL=github.service.js.map