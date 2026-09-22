"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localStorageProvider = exports.RESUME_UPLOAD_DIR = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const env_1 = require("./env");
exports.RESUME_UPLOAD_DIR = path_1.default.resolve(process.cwd(), env_1.env.RESUME_UPLOAD_DIR);
// Ensure the upload directory exists at boot.
if (!fs_1.default.existsSync(exports.RESUME_UPLOAD_DIR)) {
    fs_1.default.mkdirSync(exports.RESUME_UPLOAD_DIR, { recursive: true });
}
exports.localStorageProvider = {
    async save(filename, buffer) {
        const fullPath = path_1.default.join(exports.RESUME_UPLOAD_DIR, filename);
        await fs_1.default.promises.writeFile(fullPath, buffer);
        return fullPath;
    },
    resolveUrl(storedLocation) {
        // Phase 1: no public file server is exposed; this returns a relative
        // reference the backend itself uses to re-open the file for parsing.
        return path_1.default.relative(process.cwd(), storedLocation);
    },
    async delete(storedLocation) {
        await fs_1.default.promises.unlink(storedLocation).catch(() => undefined);
    },
};
//# sourceMappingURL=storage.js.map