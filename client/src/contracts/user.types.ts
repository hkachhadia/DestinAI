export type Plan = "free" | "pro" | "enterprise";
export type ExperienceLevel = "0-1" | "1-3" | "3-5" | "5-8" | "8+";

export interface User {
  id: string;     // server returns id (via toPublicUser)
  name: string;
  email: string;
  avatarUrl?: string;
  role: "user" | "admin";
  plan: Plan;
  college?: string;
  location?: string;
  experienceLevel?: ExperienceLevel;
  targetRole?: string;
  targetCompanies?: string[];
  isOnboarded: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Server expects a single 'name' field — AuthPage combines firstName+lastName before sending
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  college?: string;
  location?: string;
  experienceLevel?: ExperienceLevel;
  targetRole?: string;
  targetCompanies?: string[];
  bio?: string;
}
