import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the Terms & Privacy Policy" }),
    }),
  })
  .strict();
export type SignupFormValues = z.infer<typeof signupSchema>;

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  college: z.string().optional(),
  location: z.string().min(1, "Location helps us tailor local market data"),
  experienceLevel: z.enum(["0-1", "1-3", "3-5", "5-8", "8+"]).optional(),
});
export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateResumeFile(file: File | null): string | null {
  if (!file) return "Please select a resume file";
  if (!ALLOWED_RESUME_TYPES.includes(file.type)) return "Only PDF or DOCX files are supported";
  if (file.size > MAX_RESUME_SIZE_BYTES) return "File must be smaller than 5MB";
  return null;
}

const USERNAME_RE = /^[a-zA-Z0-9_-]{2,39}$/;

export const connectAccountsSchema = z.object({
  githubUsername: z
    .string()
    .optional()
    .refine((v) => !v || USERNAME_RE.test(v), "Enter a valid GitHub username"),
  leetcodeUsername: z
    .string()
    .optional()
    .refine((v) => !v || USERNAME_RE.test(v), "Enter a valid LeetCode username"),
  codeforcesHandle: z
    .string()
    .optional()
    .refine((v) => !v || USERNAME_RE.test(v), "Enter a valid Codeforces handle"),
  codechefUsername: z
    .string()
    .optional()
    .refine((v) => !v || USERNAME_RE.test(v), "Enter a valid CodeChef username"),
  linkedinUrl: z
    .string()
    .optional()
    .refine((v) => !v || v.includes("linkedin.com"), "Enter a valid LinkedIn URL"),
});
export type ConnectAccountsValues = z.infer<typeof connectAccountsSchema>;

export const targetRoleSchema = z.object({
  targetRole: z.string().min(1, "Select a target role"),
  targetCompanies: z.array(z.string()).default([]),
});
export type TargetRoleValues = z.infer<typeof targetRoleSchema>;
