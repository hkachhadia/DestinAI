import { IUser } from "@modules/user/user.model";

/** Fields safe to send to the client — never includes passwordHash/refreshTokenHash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  authProvider: IUser["authProvider"];
  avatarUrl?: string;
  role: IUser["role"];
  plan: IUser["plan"];
  college?: string;
  location?: string;
  experienceLevel?: IUser["experienceLevel"];
  targetRole?: string;
  targetCompanies: string[];
  isOnboarded: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export function toPublicUser(user: IUser): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
    role: user.role,
    plan: user.plan,
    college: user.college,
    location: user.location,
    experienceLevel: user.experienceLevel,
    targetRole: user.targetRole,
    targetCompanies: user.targetCompanies,
    isOnboarded: user.isOnboarded,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}
