import { Schema, model, Document, Types } from 'mongoose';

export type CPPlatform = 'leetcode' | 'codeforces' | 'codechef' | 'gfg' | 'hackerrank';

export const CP_PLATFORMS: CPPlatform[] = ['leetcode', 'codeforces', 'codechef', 'gfg', 'hackerrank'];

export interface ICPStats {
  rating: number;
  maxRating: number;
  rank: string; // platform-specific rank label ("Guardian", "Expert", "5 star", etc.)
  problemsSolved: { easy: number; medium: number; hard: number; total: number };
  contestsAttended: number;
  badges: string[];
}

export interface ICompetitiveProfile extends Document {
  userId: Types.ObjectId;
  platform: CPPlatform;
  handle: string;
  stats: ICPStats;
  lastSyncedAt: Date;
  lastSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const competitiveProfileSchema = new Schema<ICompetitiveProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: CP_PLATFORMS, required: true },
    handle: { type: String, required: true },
    stats: {
      rating: { type: Number, default: 0 },
      maxRating: { type: Number, default: 0 },
      rank: { type: String, default: '' },
      problemsSolved: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      contestsAttended: { type: Number, default: 0 },
      badges: [String],
    },
    lastSyncedAt: { type: Date, default: Date.now },
    lastSyncError: String,
  },
  { timestamps: true }
);

competitiveProfileSchema.index({ userId: 1, platform: 1 }, { unique: true });

export const CompetitiveProfile = model<ICompetitiveProfile>('CompetitiveProfile', competitiveProfileSchema);
