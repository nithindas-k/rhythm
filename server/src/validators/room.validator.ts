import { z } from 'zod';

// ─── REST Schemas ─────────────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  type: z.enum(['couples', 'party']),
});

export const roomCodeParamsSchema = z.object({
  code: z.string().length(6, 'Room code must be 6 characters'),
});

export const inviteMemberSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const transferHostSchema = z.object({
  newHostId: z.string().min(1, 'newHostId is required'),
});

export const memberControlSchema = z.object({
  hasControl: z.boolean(),
});

export const memberControlParamsSchema = z.object({
  code: z.string().length(6, 'Room code must be 6 characters'),
  userId: z.string().min(1, 'userId is required'),
});

export const addToQueueSchema = z.object({
  songId: z.string().min(1, 'songId is required'),
});

export const queueSongParamsSchema = z.object({
  code: z.string().length(6, 'Room code must be 6 characters'),
  songId: z.string().min(1, 'songId is required'),
});

export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type InviteMemberDto = z.infer<typeof inviteMemberSchema>;
export type TransferHostDto = z.infer<typeof transferHostSchema>;
export type MemberControlDto = z.infer<typeof memberControlSchema>;
export type AddToQueueDto = z.infer<typeof addToQueueSchema>;

// ─── Socket Schemas ───────────────────────────────────────────────────────────

export const socketJoinRoomSchema = z.object({
  roomCode: z.string().length(6),
});

export const socketLeaveRoomSchema = z.object({
  roomCode: z.string().length(6),
});

export const socketPlaySchema = z.object({
  roomCode: z.string().length(6),
  trackId: z.string().optional(),
  positionMs: z.number().min(0).default(0),
  scheduledAt: z.number().optional(),
});

export const socketPauseSchema = z.object({
  roomCode: z.string().length(6),
  positionMs: z.number().min(0),
});

export const socketSeekSchema = z.object({
  roomCode: z.string().length(6),
  positionMs: z.number().min(0),
});

export const socketChangeSongSchema = z.object({
  roomCode: z.string().length(6),
  trackId: z.string().min(1),
});

export const socketQueueAddSchema = z.object({
  roomCode: z.string().length(6),
  songId: z.string().min(1),
});

export const socketQueueRemoveSchema = z.object({
  roomCode: z.string().length(6),
  songId: z.string().min(1),
});

export const socketSyncPingSchema = z.object({
  clientTs: z.number(),
});
