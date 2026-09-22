export interface GithubProfile {
  username: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  syncStatus: "idle" | "syncing" | "failed";
  lastSyncedAt?: string;
}

export interface ConnectGithubPayload {
  username: string;
}
