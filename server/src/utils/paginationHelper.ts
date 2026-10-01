import { PAGINATION } from '../constants/limits';

export interface CursorPaginationOptions {
  cursor?: string;
  limit?: number;
  sortField?: string;
  sortOrder?: 1 | -1;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

/**
 * Builds a MongoDB filter for cursor-based pagination.
 * Cursor is the serialised value of the sort field of the last seen document.
 */
export function buildCursorFilter(
  cursor?: string,
  sortField: string = PAGINATION.CURSOR_FIELD,
  sortOrder: 1 | -1 = -1
): Record<string, unknown> {
  if (!cursor) return {};

  const operator = sortOrder === -1 ? '$lt' : '$gt';
  return { [sortField]: { [operator]: cursor } };
}

/**
 * Parses and validates the limit query param.
 */
export function parseLimit(rawLimit?: string | number): number {
  const parsed = typeof rawLimit === 'number' ? rawLimit : parseInt(rawLimit ?? '', 10);
  if (isNaN(parsed) || parsed < 1) return PAGINATION.DEFAULT_LIMIT;
  return Math.min(parsed, PAGINATION.MAX_LIMIT);
}

/**
 * Given a list of items fetched with limit+1, determines nextCursor and trims
 * the array to the requested limit.
 */
export function paginate<T extends Record<string, unknown>>(
  items: T[],
  limit: number,
  cursorField: keyof T = '_id' as keyof T
): CursorPaginationResult<T> {
  const hasNextPage = items.length > limit;
  const trimmed = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage
    ? String(trimmed[trimmed.length - 1][cursorField])
    : null;

  return { items: trimmed, nextCursor, hasNextPage };
}
