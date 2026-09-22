import { UserModel, IUser, IUserSettings } from './user.model';
import { ApiError } from '@utils/ApiError';
import { UpdateProfileInput } from './user.validation';

export const userService = {
  async getById(userId: string): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    Object.assign(user, input);
    // Keep profile.targetRole in sync
    if (input.targetRole) {
      user.profile = { ...user.profile, targetRole: input.targetRole };
    }
    if (input.targetRole && !user.isOnboarded) {
      user.isOnboarded = true;
    }
    await user.save();
    return user;
  },

  async getSettings(userId: string): Promise<IUser['settings'] & { profile: { fullName: string; email: string; bio: string; avatarUrl?: string; memberSince: string } }> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return {
      ...user.settings,
      profile: {
        fullName: user.name,
        email: user.email,
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl,
        memberSince: user.createdAt.toISOString(),
      },
    };
  },

  async updateSettings(userId: string, patch: Partial<{ profile: { fullName?: string; email?: string; bio?: string }; notifications: Partial<IUserSettings['notifications']>; theme: IUserSettings['theme'] }>): Promise<IUser['settings']> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    if (patch.profile?.fullName) user.name = patch.profile.fullName;
    if (patch.profile?.bio !== undefined) user.bio = patch.profile.bio;
    if (patch.notifications) {
      user.settings.notifications = { ...user.settings.notifications, ...patch.notifications };
    }
    if (patch.theme) user.settings.theme = patch.theme;
    await user.save();
    return user.settings;
  },

  async deleteAccount(userId: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    // Cascade-delete all user data in parallel
    const { Types } = await import('mongoose');
    const uid = new Types.ObjectId(userId);
    const { Analysis } = await import('../analysis/analysis.model');
    const { AIInsight } = await import('../ai/aiInsight.model');
    const { Resume } = await import('../resume/resume.model');
    const { GitHubProfile } = await import('../github/github.model');
    const { CompetitiveProfile } = await import('../competitiveProgramming/cp.model');

    await Promise.allSettled([
      Analysis.deleteMany({ userId: uid }),
      AIInsight.deleteMany({ userId: uid }),
      Resume.deleteMany({ userId: uid }),
      GitHubProfile.deleteMany({ userId: uid }),
      CompetitiveProfile.deleteMany({ userId: uid }),
      user.deleteOne(),
    ]);
  },
};
