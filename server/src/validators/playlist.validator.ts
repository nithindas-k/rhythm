import { z } from 'zod';

export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverUrl: z.string().url().optional(),
  isPublic: z.boolean().default(false),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  coverUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
});

export const addTrackSchema = z.object({
  songId: z.string().min(1, 'songId is required'),
});

export const reorderTracksSchema = z.object({
  /** Array of songIds in the desired new order */
  songIds: z.array(z.string()).min(1),
});

export type CreatePlaylistDto = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistDto = z.infer<typeof updatePlaylistSchema>;
export type AddTrackDto = z.infer<typeof addTrackSchema>;
export type ReorderTracksDto = z.infer<typeof reorderTracksSchema>;
