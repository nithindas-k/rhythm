import { z } from 'zod';

export const songSearchSchema = z.object({
  q: z.string().optional(),
  genre: z.string().optional(),
  sort: z.enum(['trending', 'newest', 'oldest']).optional().default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type SongSearchDto = z.infer<typeof songSearchSchema>;
