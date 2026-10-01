import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/responseHelper';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Factory that returns an Express middleware validating req[target] against
 * the provided Zod schema. On success, replaces req[target] with the parsed
 * (coerced + defaulted) value. On failure, responds 422 with field errors.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      sendError(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
      return;
    }

    // Replace with parsed value so downstream gets coerced + stripped data
    // Uses Object.defineProperty to safely override getter-only properties (e.g. req.query)
    Object.defineProperty(req, target, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };
}
