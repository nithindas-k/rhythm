import { z } from 'zod';

export const favoriteParamsSchema = z.object({
  songId: z.string().min(1, 'Song ID is required'),
});

export const favoriteQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type FavoriteParamsDto = z.infer<typeof favoriteParamsSchema>;
export type FavoriteQueryDto = z.infer<typeof favoriteQuerySchema>;
