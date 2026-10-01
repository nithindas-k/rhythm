import { Response } from 'express';
import { HTTP_STATUS, HttpStatusCode } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total?: number;
  limit: number;
  nextCursor?: string | null;
  prevCursor?: string | null;
  hasNextPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: PaginationMeta;
  errors?: Array<{ field?: string; message: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = MESSAGES.SUCCESS,
  statusCode: HttpStatusCode = HTTP_STATUS.OK,
  meta?: PaginationMeta
): Response {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    ...(meta && { meta }),
  };
  return res.status(statusCode).json(body);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = MESSAGES.CREATED
): Response {
  return sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendNoContent(res: Response): Response {
  return res.status(HTTP_STATUS.NO_CONTENT).send();
}

export function sendError(
  res: Response,
  message: string,
  statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: Array<{ field?: string; message: string }>
): Response {
  const body: ApiResponse<null> = {
    success: false,
    message,
    data: null,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(body);
}
