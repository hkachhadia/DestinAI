export const queryKeys = {
  currentUser: ["user", "me"] as const,
  resume: ["resume", "me"] as const,
  resumeStatus: (jobId: string) => ["resume", "status", jobId] as const,
  github: ["github", "me"] as const,
  cp: ["cp", "me"] as const,
  score: ["score", "me"] as const,
};
