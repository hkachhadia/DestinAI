"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const ApiError_1 = require("../utils/ApiError");
/**
 * Validates req[part] against a Zod schema and replaces it with the parsed
 * (and therefore type-coerced/defaulted) value. Every module's
 * `*.validation.ts` schema is run through this before reaching a controller.
 */
function validate(schema, part = "body") {
    return (req, _res, next) => {
        try {
            const parsed = schema.parse(req[part]);
            req[part] = parsed;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.flatten().fieldErrors;
                next(ApiError_1.ApiError.badRequest("Validation failed", "VALIDATION_ERROR", details));
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map