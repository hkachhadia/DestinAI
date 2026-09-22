import { Types } from 'mongoose';
import { CompetitiveProfile, ICompetitiveProfile, CPPlatform, CP_PLATFORMS } from './cp.model';
import { leetcodeAdapter } from './adapters/leetcodeAdapter';
import { codeforcesAdapter } from './adapters/codeforcesAdapter';
import { codechefAdapter } from './adapters/codechefAdapter';
import { gfgAdapter } from './adapters/gfgAdapter';
import { hackerrankAdapter } from './adapters/hackerrankAdapter';
import type { CPAdapter } from './adapters/types';
import { ApiError, ErrorCodes } from '@utils/ApiError';

const ADAPTERS: Record<CPPlatform, CPAdapter> = {
  leetcode: leetcodeAdapter,
  codeforces: codeforcesAdapter,
  codechef: codechefAdapter,
  gfg: gfgAdapter,
  hackerrank: hackerrankAdapter,
};

function assertSupportedPlatform(platform: string): asserts platform is CPPlatform {
  if (!CP_PLATFORMS.includes(platform as CPPlatform)) {
    throw new ApiError(400, `Unsupported platform "${platform}". Supported: ${CP_PLATFORMS.join(', ')}`, ErrorCodes.CP_PLATFORM_UNSUPPORTED);
  }
}

export async function connectPlatform(userId: string, platform: string, handle: string): Promise<ICompetitiveProfile> {
  assertSupportedPlatform(platform);

  await CompetitiveProfile.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), platform },
    { userId: new Types.ObjectId(userId), platform, handle },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return syncPlatform(userId, platform);
}

export async function syncPlatform(userId: string, platform: string): Promise<ICompetitiveProfile> {
  assertSupportedPlatform(platform);

  const profile = await CompetitiveProfile.findOne({ userId: new Types.ObjectId(userId), platform });
  if (!profile) throw new ApiError(404, `No ${platform} handle connected`, ErrorCodes.CP_HANDLE_NOT_FOUND);

  try {
    const stats = await ADAPTERS[platform].fetchProfile(profile.handle);
    profile.stats = stats;
    profile.lastSyncedAt = new Date();
    profile.lastSyncError = undefined;
    await profile.save();
    return profile;
  } catch (err) {
    profile.lastSyncError = err instanceof Error ? err.message : 'Unknown sync error';
    profile.lastSyncedAt = new Date();
    await profile.save();
    throw err;
  }
}

/** Syncs every platform the user has connected, in parallel. Individual
 * platform failures don't fail the whole batch — each is recorded on its
 * own document via lastSyncError, and the scoring engine simply treats an
 * unsynced platform as 0 contribution rather than blocking the analysis. */
export async function syncAllPlatforms(userId: string): Promise<ICompetitiveProfile[]> {
  const profiles = await CompetitiveProfile.find({ userId: new Types.ObjectId(userId) });
  const results = await Promise.allSettled(profiles.map((p) => syncPlatform(userId, p.platform)));
  return results
    .filter((r): r is PromiseFulfilledResult<ICompetitiveProfile> => r.status === 'fulfilled')
    .map((r) => r.value);
}

export async function getAllProfiles(userId: string): Promise<ICompetitiveProfile[]> {
  return CompetitiveProfile.find({ userId: new Types.ObjectId(userId) });
}
