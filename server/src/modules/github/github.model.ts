import { Schema, model, Document, Types } from 'mongoose';

export interface IGitHubLanguageStat {
  language: string;
  percentage: number;
}

export interface IGitHubPinnedRepo {
  name: string;
  description: string;
  stars: number;
  language: string | null;
  url: string;
}

export interface IGitHubStats {
  publicRepos: number;
  followers: number;
  totalStars: number;
  totalCommitsLastYear: number;
  topLanguages: IGitHubLanguageStat[];
  pinnedRepos: IGitHubPinnedRepo[];
  accountCreatedAt?: string;
}

export interface IGitHubProfile extends Document {
  userId: Types.ObjectId;
  username: string;
  stats: IGitHubStats;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const githubProfileSchema = new Schema<IGitHubProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    username: { type: String, required: true },
    stats: {
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      totalCommitsLastYear: { type: Number, default: 0 },
      topLanguages: [{ language: String, percentage: Number }],
      pinnedRepos: [{ name: String, description: String, stars: Number, language: String, url: String }],
      accountCreatedAt: String,
    },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const GitHubProfile = model<IGitHubProfile>('GitHubProfile', githubProfileSchema);
