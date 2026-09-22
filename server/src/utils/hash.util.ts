import bcrypt from "bcryptjs";
import { env } from "@config/env";

export const hashUtil = {
  async hash(plain: string): Promise<string> {
    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(plain, salt);
  },

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },
};
