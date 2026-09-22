export type CPPlatform = "leetcode" | "codeforces" | "codechef" | "gfg" | "hackerrank";

export interface CPProfile {
  platform: CPPlatform;
  handle: string;
  rating?: number;
  rank?: string;
  problemsSolved?: { easy: number; medium: number; hard: number; total: number };
  syncStatus: "idle" | "syncing" | "failed";
}

export interface ConnectCPPayload {
  platform: CPPlatform;
  handle: string;
}
