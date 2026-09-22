import path from "path";
import fs from "fs";
import { env } from "./env";

/**
 * Phase 1 stores resumes on local disk. Phase 2 can swap this for S3/
 * Cloudinary by implementing the same StorageProvider interface and
 * changing only `resume.service.ts`'s import — no other file needs to know
 * where files physically live.
 */
export interface StorageProvider {
  /** Absolute or provider-specific location the file was saved to. */
  save(filename: string, buffer: Buffer): Promise<string>;
  /** Returns a URL/path the app can use to reference the stored file. */
  resolveUrl(storedLocation: string): string;
  delete(storedLocation: string): Promise<void>;
}

export const RESUME_UPLOAD_DIR = path.resolve(process.cwd(), env.RESUME_UPLOAD_DIR);

// Ensure the upload directory exists at boot.
if (!fs.existsSync(RESUME_UPLOAD_DIR)) {
  fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });
}

export const localStorageProvider: StorageProvider = {
  async save(filename, buffer) {
    const fullPath = path.join(RESUME_UPLOAD_DIR, filename);
    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  },
  resolveUrl(storedLocation: string) {
    // Phase 1: no public file server is exposed; this returns a relative
    // reference the backend itself uses to re-open the file for parsing.
    return path.relative(process.cwd(), storedLocation);
  },
  async delete(storedLocation: string) {
    await fs.promises.unlink(storedLocation).catch(() => undefined);
  },
};
