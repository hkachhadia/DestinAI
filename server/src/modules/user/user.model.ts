import { Schema, model, Document, Types } from 'mongoose';

export interface IUserSettings {
  notifications: {
    weeklyDigest: boolean;
    scoreAlerts: boolean;
    productUpdates: boolean;
  };
  theme: 'dark' | 'light';
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash?: string;
  refreshTokenHash?: string;
  tokenVersion: number;
  authProvider: 'local' | 'google' | 'github';
  avatarUrl?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'enterprise';
  // Onboarding profile fields
  college?: string;
  location?: string;
  experienceLevel?: '0-1' | '1-3' | '3-5' | '5-8' | '8+';
  targetRole?: string;
  targetCompanies: string[];
  bio?: string;
  isOnboarded: boolean;
  isEmailVerified: boolean;
  // Settings
  settings: IUserSettings;
  // Phase 2 compatibility (server-2 reads profile.targetRole)
  profile: {
    avatarUrl?: string;
    headline?: string;
    targetRole?: string;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, select: false },
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    avatarUrl: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    college: String,
    location: String,
    experienceLevel: { type: String, enum: ['0-1', '1-3', '3-5', '5-8', '8+'] },
    targetRole: String,
    targetCompanies: { type: [String], default: [] },
    bio: String,
    isOnboarded: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    settings: {
      notifications: {
        weeklyDigest: { type: Boolean, default: true },
        scoreAlerts: { type: Boolean, default: true },
        productUpdates: { type: Boolean, default: false },
      },
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
    },
    // Virtual mirror for server-2 compatibility
    profile: {
      avatarUrl: String,
      headline: String,
      targetRole: String,
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

// Keep profile.targetRole in sync with top-level targetRole
userSchema.pre('save', function (next) {
  if (this.isModified('targetRole')) {
    this.profile = { ...this.profile, targetRole: this.targetRole };
  }
  next();
});

export const UserModel = model<IUser>('User', userSchema);
// Alias for server-2 compatibility
export const User = UserModel;
