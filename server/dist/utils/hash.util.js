"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashUtil = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
exports.hashUtil = {
    async hash(plain) {
        const salt = await bcryptjs_1.default.genSalt(env_1.env.BCRYPT_SALT_ROUNDS);
        return bcryptjs_1.default.hash(plain, salt);
    },
    async compare(plain, hashed) {
        return bcryptjs_1.default.compare(plain, hashed);
    },
};
//# sourceMappingURL=hash.util.js.map