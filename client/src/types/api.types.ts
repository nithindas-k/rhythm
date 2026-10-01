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
  data: T;
  meta?: PaginationMeta;
  errors?: Array<{ field?: string; message: string }>;
}
