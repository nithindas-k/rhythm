import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { ValidationError } from '../errors/ValidationError';
import { sendError } from '../utils/responseHelper';
import { logger } from '../utils/logger';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Operational AppError ────────────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, req }, 'Non-operational AppError');
    }

    if (err instanceof ValidationError) {
      sendError(res, err.message, err.statusCode, err.fieldErrors);
      return;
    }

    sendError(res, err.message, err.statusCode);
    return;
  }

  // ── Zod validation (unhandled, direct throw) ────────────────────────────────
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    sendError(res, MESSAGES.VALIDATION_ERROR, HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
    return;
  }

  // ── Mongoose duplicate key ──────────────────────────────────────────────────
  if (
    err instanceof mongoose.mongo.MongoServerError &&
    (err as mongoose.mongo.MongoServerError).code === 11000
  ) {
    const mongoErr = err as mongoose.mongo.MongoServerError;
    const field = Object.keys(mongoErr.keyPattern ?? {})[0] ?? 'field';
    sendError(
      res,
      `${field} already exists`,
      HTTP_STATUS.CONFLICT,
      [{ field, message: `${field} already exists` }]
    );
    return;
  }

  // ── Mongoose cast error (invalid ObjectId etc.) ─────────────────────────────
  if (err instanceof mongoose.Error.CastError) {
    sendError(
      res,
      `Invalid value for field: ${err.path}`,
      HTTP_STATUS.BAD_REQUEST
    );
    return;
  }

  // ── JWT errors forwarded as UnauthorizedError (handled above) ───────────────
  // Any remaining unknown errors — do NOT leak stack in production

  logger.error({ err, req }, 'Unhandled server error');

  sendError(
    res,
    env.NODE_ENV === 'production' ? MESSAGES.INTERNAL_ERROR : String((err as Error).message),
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
}
