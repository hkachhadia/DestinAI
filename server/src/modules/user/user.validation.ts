import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    college: z.string().trim().max(200).optional(),
    location: z.string().trim().max(200).optional(),
    experienceLevel: z.enum(["0-1", "1-3", "3-5", "5-8", "8+"]).optional(),
    targetRole: z.string().trim().max(120).optional(),
    targetCompanies: z.array(z.string().trim().min(1)).max(20).optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
