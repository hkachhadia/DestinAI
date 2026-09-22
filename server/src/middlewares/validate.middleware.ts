import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "@utils/ApiError";

type RequestPart = "body" | "params" | "query";

/**
 * Validates req[part] against a Zod schema and replaces it with the parsed
 * (and therefore type-coerced/defaulted) value. Every module's
 * `*.validation.ts` schema is run through this before reaching a controller.
 */
export function validate(schema: AnyZodObject, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      req[part] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.flatten().fieldErrors;
        next(ApiError.badRequest("Validation failed", "VALIDATION_ERROR", details));
        return;
      }
      next(error);
    }
  };
}
