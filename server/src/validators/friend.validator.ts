import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const respondFriendRequestSchema = z.object({
  // action in URL param (accept/reject) — no body needed
});

export const friendSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type SendFriendRequestDto = z.infer<typeof sendFriendRequestSchema>;
export type FriendSearchDto = z.infer<typeof friendSearchSchema>;
