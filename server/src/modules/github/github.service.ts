import { Types } from 'mongoose';

import { createRetryingClient } from '../../utils/httpClient';

import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';
import { env } from '../../config/env';

import {
  GitHubProfile,
  IGitHubProfile,
  IGitHubLanguageStat,
  IGitHubPinnedRepo,
} from './github.model';

const githubClient = createRetryingClient({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(env.GITHUB_API_TOKEN
      ? {
          Authorization: `Bearer ${env.GITHUB_API_TOKEN}`,
        }
      : {}),
  },
});

// Public REST fallback. GitHub's public user/repository endpoints can be
// accessed without authentication. This is intentionally kept separate from
// the authenticated client so an invalid/revoked server token does not make
// all public GitHub scoring fail.
const githubPublicClient = createRetryingClient({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});

function isGitHubUnauthorized(err: unknown): boolean {
  const error = err as GitHubErrorResponse;
  return error.response?.status === 401;
}

interface GitHubUserResponse {
  login: string;
  public_repos: number;
  followers: number;
  created_at: string;
}

interface GitHubRepoResponse {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  fork: boolean;
}

interface GitHubErrorResponse {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      message?: string;
      documentation_url?: string;
      status?: string;
    };
  };
  message?: string;
}

/**
 * Fetch a GitHub user profile.
 */
async function fetchGitHubUser(
  username: string,
): Promise<GitHubUserResponse> {
  try {
    const { data } = await githubClient.get<GitHubUserResponse>(
      `/users/${encodeURIComponent(username)}`,
    );

    return data;
  } catch (err) {
    // A bad/revoked GITHUB_API_TOKEN should not prevent public GitHub
    // profiles from being analyzed. Retry the public endpoint once without
    // authentication. Other errors are still surfaced normally.
    if (isGitHubUnauthorized(err)) {
      logger.warn('[GITHUB] Authenticated request returned 401; retrying public user endpoint', {
        username,
      });

      try {
        const { data } = await githubPublicClient.get<GitHubUserResponse>(
          `/users/${encodeURIComponent(username)}`,
        );
        return data;
      } catch (publicErr) {
        handleGithubError(publicErr);
      }
    }

    handleGithubError(err);
  }
}

/**
 * Fetch public repositories for a GitHub user.
 */
async function fetchGitHubRepos(
  username: string,
): Promise<GitHubRepoResponse[]> {
  const requestConfig = {
    params: {
      per_page: 100,
      sort: 'updated',
    },
  };

  try {
    const { data } = await githubClient.get<GitHubRepoResponse[]>(
      `/users/${encodeURIComponent(username)}/repos`,
      requestConfig,
    );

    return data;
  } catch (err) {
    // See fetchGitHubUser(): a stale server token must not turn public
    // repository data into a zero GitHub score.
    if (isGitHubUnauthorized(err)) {
      logger.warn('[GITHUB] Authenticated repository request returned 401; retrying public repository endpoint', {
        username,
      });

      try {
        const { data } = await githubPublicClient.get<GitHubRepoResponse[]>(
          `/users/${encodeURIComponent(username)}/repos`,
          requestConfig,
        );
        return data;
      } catch (publicErr) {
        handleGithubError(publicErr);
      }
    }

    handleGithubError(err);
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
async function fetchCommitsLastYear(
  username: string,
): Promise<number> {
  if (!env.GITHUB_API_TOKEN) {
    logger.warn('[GITHUB] GITHUB_API_TOKEN is not configured');

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
    const { data } = await githubClient.post<{
      data?: {
        user?: {
          contributionsCollection?: {
            contributionCalendar?: {
              totalContributions?: number;
            };
          };
        };
      };
      errors?: Array<{
        message?: string;
        type?: string;
      }>;
    }>(
      '/graphql',
      {
        query,
        variables: {
          login: username,
        },
      },
    );

    if (data.errors?.length) {
      logger.warn('[GITHUB] GraphQL returned errors; commits will be recorded as 0', {
        username,
        errors: data.errors,
      });

      return 0;
    }

    const totalContributions =
      data.data?.user?.contributionsCollection?.contributionCalendar
        ?.totalContributions;

    if (typeof totalContributions !== 'number') {
      logger.warn('[GITHUB] GraphQL returned no contribution count; commits will be recorded as 0', {
        username,
      });
      return 0;
    }

    return totalContributions;
  } catch (err) {
    const error = err as GitHubErrorResponse;

    logger.warn('[GITHUB] GraphQL contribution request failed', {
      username,
      status: error.response?.status,
      message:
        error.response?.data?.message ||
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
function handleGithubError(err: unknown): never {
  const error = err as GitHubErrorResponse;

  const status = error.response?.status;

  const message =
    error.response?.data?.message ||
    error.message ||
    'Unknown GitHub API error';

  const documentationUrl =
    error.response?.data?.documentation_url;

  logger.error('[GITHUB_API_ERROR]', {
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
    throw new ApiError(
      502,
      'GitHub authentication failed. Check GITHUB_API_TOKEN.',
      ErrorCodes.GITHUB_SYNC_FAILED,
    );
  }

  /*
   * 404 = username/resource does not exist.
   */
  if (status === 404) {
    throw new ApiError(
      404,
      'GitHub username not found',
      ErrorCodes.GITHUB_PROFILE_NOT_FOUND,
    );
  }

  /*
   * 403 / 429 can indicate:
   * - rate limiting
   * - permission restrictions
   * - GitHub API access restrictions
   */
  if (status === 403 || status === 429) {
    throw new ApiError(
      429,
      `GitHub API access/rate limit error: ${message}`,
      ErrorCodes.GITHUB_RATE_LIMITED,
    );
  }

  /*
   * Everything else becomes a GitHub synchronization error,
   * but the real GitHub error is preserved in Render logs.
   */
  throw new ApiError(
    502,
    `GitHub API error: ${message}`,
    ErrorCodes.GITHUB_SYNC_FAILED,
  );
}

/**
 * Calculate language distribution from non-fork repositories.
 */
function computeTopLanguages(
  repos: GitHubRepoResponse[],
): IGitHubLanguageStat[] {
  const counts: Record<string, number> = {};

  for (const repo of repos) {
    if (!repo.language || repo.fork) {
      continue;
    }

    counts[repo.language] =
      (counts[repo.language] ?? 0) + 1;
  }

  const total =
    Object.values(counts).reduce(
      (a, b) => a + b,
      0,
    ) || 1;

  return Object.entries(counts)
    .map(([language, count]) => ({
      language,
      percentage: Math.round((count / total) * 100),
    }))
    .sort(
      (a, b) =>
        b.percentage - a.percentage,
    )
    .slice(0, 8);
}

/**
 * Select the most relevant repositories for display.
 *
 * Forks are excluded and repositories are ordered by stars.
 */
function computePinnedRepos(
  repos: GitHubRepoResponse[],
): IGitHubPinnedRepo[] {
  return repos
    .filter((repo) => !repo.fork)
    .sort(
      (a, b) =>
        b.stargazers_count -
        a.stargazers_count,
    )
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
export async function connectGitHub(
  userId: string,
  username: string,
): Promise<IGitHubProfile> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    throw new ApiError(
      400,
      'GitHub username is required',
      ErrorCodes.GITHUB_PROFILE_NOT_FOUND,
    );
  }

  /*
   * First verify that the GitHub username exists.
   */
  const user = await fetchGitHubUser(
    normalizedUsername,
  );

  /*
   * Create/update the profile with basic information.
   *
   * The full sync immediately below will replace these
   * temporary values with complete GitHub statistics.
   */
  await GitHubProfile.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
    },
    {
      userId: new Types.ObjectId(userId),
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
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

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
export async function syncGitHubProfile(
  userId: string,
): Promise<IGitHubProfile> {
  const existing =
    await GitHubProfile.findOne({
      userId: new Types.ObjectId(userId),
    });

  if (!existing) {
    throw new ApiError(
      404,
      'Connect a GitHub account first',
      ErrorCodes.GITHUB_PROFILE_NOT_FOUND,
    );
  }

  const username = existing.username;

  logger.info('[GITHUB] Starting profile sync', {
    userId,
    username,
    authenticatedClientConfigured: Boolean(env.GITHUB_API_TOKEN),
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
  const totalStars = repos.reduce(
    (sum, repo) =>
      sum + repo.stargazers_count,
    0,
  );

  /*
   * Contributions are fetched separately because they
   * require GraphQL authentication.
   */
  const commitsLastYear =
    await fetchCommitsLastYear(username);

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

  logger.info('[GITHUB] Profile sync successful', {
    userId,
    username,
    publicRepos: user.public_repos,
    followers: user.followers,
    totalStars,
    commitsLastYear,
    repositoryCountFetched: repos.length,
    topLanguages:
      existing.stats.topLanguages.map(
        (language) => language.language,
      ),
  });

  return existing;
}

/**
 * Retrieve the currently stored GitHub profile.
 */
export async function getGitHubProfile(
  userId: string,
): Promise<IGitHubProfile | null> {
  return GitHubProfile.findOne({
    userId: new Types.ObjectId(userId),
  });
}