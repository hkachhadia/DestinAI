import { Types } from 'mongoose';
import { createRetryingClient } from '../../utils/httpClient';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { env } from '../../config/env';
import { GitHubProfile, IGitHubProfile, IGitHubLanguageStat, IGitHubPinnedRepo } from './github.model';

const githubClient = createRetryingClient({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    ...(env.GITHUB_API_TOKEN ? { Authorization: `Bearer ${env.GITHUB_API_TOKEN}` } : {}),
  },
});

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

async function fetchGitHubUser(username: string): Promise<GitHubUserResponse> {
  try {
    const { data } = await githubClient.get<GitHubUserResponse>(`/users/${username}`);
    return data;
  } catch (err) {
    handleGithubError(err); // always throws
    throw err; // satisfies TypeScript
  }
}

async function fetchGitHubRepos(username: string): Promise<GitHubRepoResponse[]> {
  try {
    const { data } = await githubClient.get<GitHubRepoResponse[]>(`/users/${username}/repos`, {
      params: { per_page: 100, sort: 'updated' },
    });
    return data;
  } catch (err) {
    handleGithubError(err); // always throws
    throw err; // satisfies TypeScript
  }
}

/** GitHub's REST API has no single "commits in last year" endpoint for a
 * user; the accurate way is the GraphQL contributionsCollection. We fall
 * back gracefully to 0 if no token is configured (GraphQL requires auth). */
async function fetchCommitsLastYear(username: string): Promise<number> {
  if (!env.GITHUB_API_TOKEN) return 0;

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar { totalContributions }
        }
      }
    }
  `;

  try {
    const { data } = await githubClient.post<{
      data?: { user: { contributionsCollection: { contributionCalendar: { totalContributions: number } } } };
    }>('/graphql', { query, variables: { login: username } });
    return data.data?.user.contributionsCollection.contributionCalendar.totalContributions ?? 0;
  } catch {
    // Non-fatal: commit velocity is one signal among several in the scoring
    // engine, so a GraphQL hiccup shouldn't fail the whole sync.
    return 0;
  }
}

function handleGithubError(err: unknown): never {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 404) throw new ApiError(404, 'GitHub username not found', ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
  if (status === 403 || status === 429) {
    throw new ApiError(429, 'GitHub API rate limit exceeded, try again later', ErrorCodes.GITHUB_RATE_LIMITED);
  }
  throw new ApiError(502, 'Failed to sync GitHub profile', ErrorCodes.GITHUB_SYNC_FAILED);
}

function computeTopLanguages(repos: GitHubRepoResponse[]): IGitHubLanguageStat[] {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (!repo.language || repo.fork) continue;
    counts[repo.language] = (counts[repo.language] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([language, count]) => ({ language, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
}

function computePinnedRepos(repos: GitHubRepoResponse[]): IGitHubPinnedRepo[] {
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 6)
    .map((r) => ({
      name: r.name,
      description: r.description ?? '',
      stars: r.stargazers_count,
      language: r.language,
      url: r.html_url,
    }));
}

export async function connectGitHub(userId: string, username: string): Promise<IGitHubProfile> {
  // Validate username exists before persisting — also fetches user data
  const user = await fetchGitHubUser(username);

  // Create/update the record immediately with basic stats so the profile
  // exists before the full sync. This means the record is never empty.
  await GitHubProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId) },
    {
      userId: new Types.ObjectId(userId),
      username,
      // Populate basic stats right away from the /users/:username call
      // so even a partial sync contributes to scoring.
      stats: {
        publicRepos: user.public_repos,
        followers:   user.followers,
        totalStars:  0,          // full sync below will populate
        totalCommitsLastYear: 0,
        topLanguages: [],
        pinnedRepos: [],
        accountCreatedAt: user.created_at,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Immediately perform a full sync so stats are populated before the
  // first analysis runs. Non-blocking error handling: if the sync fails
  // (e.g. rate limit) the profile record still exists for the next run.
  try {
    return await syncGitHubProfile(userId);
  } catch {
    // Return the partially-populated profile; auto-sync in analysis.service
    // will retry before the next scoring pass.
    const partial = await GitHubProfile.findOne({ userId: new Types.ObjectId(userId) });
    if (!partial) throw new ApiError(500, 'GitHub profile disappeared after connect', ErrorCodes.GITHUB_SYNC_FAILED);
    return partial;
  }
}

export async function syncGitHubProfile(userId: string): Promise<IGitHubProfile> {
  const existing = await GitHubProfile.findOne({ userId: new Types.ObjectId(userId) });
  if (!existing) throw new ApiError(404, 'Connect a GitHub account first', ErrorCodes.GITHUB_PROFILE_NOT_FOUND);

  const [user, repos] = await Promise.all([fetchGitHubUser(existing.username), fetchGitHubRepos(existing.username)]);
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);
  const commitsLastYear = await fetchCommitsLastYear(existing.username);

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
  return existing;
}

export async function getGitHubProfile(userId: string): Promise<IGitHubProfile | null> {
  return GitHubProfile.findOne({ userId: new Types.ObjectId(userId) });
}
