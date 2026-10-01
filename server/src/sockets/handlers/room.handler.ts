import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../middlewares/socketAuth';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { MESSAGES } from '../../constants/messages';
import {
  socketJoinRoomSchema,
  socketLeaveRoomSchema,
  socketPlaySchema,
  socketPauseSchema,
  socketSeekSchema,
  socketChangeSongSchema,
  socketQueueAddSchema,
  socketQueueRemoveSchema,
} from '../../validators/room.validator';
import { container, TOKENS } from '../../container/index';
import { IRoomService } from '../../services/interfaces/IRoomService';
import { ISongService } from '../../services/interfaces/ISongService';
import { RedisPlaybackManager } from '../playback/playbackState';
import { TimeSyncHelper } from '../playback/timesync';
import { RoomBarrierManager } from '../playback/roomBarrierManager';
import { RoomBufferingManager } from '../playback/roomBufferingManager';
import { SocketRateLimiter } from '../middlewares/socketRateLimit';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

function getRoomChannel(code: string): string {
  return `room:${code.toUpperCase()}`;
}

export function registerRoomHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.data.user.id;
  const roomService = container.resolve<IRoomService>(TOKENS.RoomService as symbol);

  let currentJoinedRoomCode: string | null = null;

  // ─── ROOM:JOIN ─────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.ROOM_JOIN, async (data: unknown) => {
    try {
      const parsed = socketJoinRoomSchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.VALIDATION_ERROR });
        return;
      }

      const { roomCode } = parsed.data;
      const room = await roomService.joinRoom(roomCode, userId, socket.id);
      currentJoinedRoomCode = roomCode.toUpperCase();

      const channel = getRoomChannel(roomCode);
      await socket.join(channel);

      // Confirm to caller with room, current playback state, and members
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        room,
        playbackState: room.playbackState,
        members: room.members,
      });

      // Broadcast new member to room participants
      const currentMember = room.members.find((m) => m.userId === userId);
      socket.to(channel).emit(SOCKET_EVENTS.ROOM_MEMBER_JOINED, {
        member: currentMember,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── ROOM:LEAVE ────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.ROOM_LEAVE, async (data: unknown) => {
    try {
      const parsed = socketLeaveRoomSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode } = parsed.data;
      const channel = getRoomChannel(roomCode);

      const result = await roomService.leaveRoom(roomCode, userId);
      await socket.leave(channel);
      currentJoinedRoomCode = null;

      if (result.ended) {
        io.to(channel).emit(SOCKET_EVENTS.ROOM_ENDED, { reason: 'Host ended room or left' });
      } else {
        if (result.newHostId) {
          io.to(channel).emit(SOCKET_EVENTS.ROOM_HOST_CHANGED, { newHostId: result.newHostId });
        }
        socket.to(channel).emit(SOCKET_EVENTS.ROOM_MEMBER_LEFT, { userId });
      }
    } catch (err) {
      logger.error({ err, userId }, 'Error leaving room');
    }
  });

  // ─── PLAYBACK:PLAY (Barrier-coordinated start) ───────────────────────────
  socket.on(SOCKET_EVENTS.PLAYBACK_PLAY, async (data: unknown) => {
    try {
      const allowed = await SocketRateLimiter.checkRateLimit(socket.id, SOCKET_EVENTS.PLAYBACK_PLAY);
      if (!allowed) return;

      const parsed = socketPlaySchema.safeParse(data);
      if (!parsed.success) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.VALIDATION_ERROR });
        return;
      }

      const { roomCode, trackId, positionMs } = parsed.data;
      const canControl = await roomService.hasControl(roomCode, userId);
      if (!canControl) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.FORBIDDEN });
        return;
      }

      let effectiveTrackId = trackId;
      if (!effectiveTrackId) {
        const state = await RedisPlaybackManager.getState(roomCode);
        effectiveTrackId = state?.trackId;
      }
      if (!effectiveTrackId) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'No track available to play' });
        return;
      }

      const channel = getRoomChannel(roomCode);
      const sockets = await io.in(channel).fetchSockets();
      const connectedUserIds = sockets
        .map((s) => (s as any).data?.user?.id as string)
        .filter(Boolean);

      await RoomBarrierManager.startBarrier(io, roomCode, effectiveTrackId, positionMs, connectedUserIds);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── PLAYBACK:PAUSE ────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.PLAYBACK_PAUSE, async (data: unknown) => {
    try {
      const allowed = await SocketRateLimiter.checkRateLimit(socket.id, SOCKET_EVENTS.PLAYBACK_PAUSE);
      if (!allowed) return;

      const parsed = socketPauseSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode, positionMs } = parsed.data;
      const canControl = await roomService.hasControl(roomCode, userId);
      if (!canControl) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.FORBIDDEN });
        return;
      }

      RoomBarrierManager.clearBarrier(roomCode);

      const currentState = await RedisPlaybackManager.getState(roomCode);
      const updatedState = await RedisPlaybackManager.setState(roomCode, {
        trackId: currentState?.trackId,
        isPlaying: false,
        positionMs,
      });

      const channel = getRoomChannel(roomCode);
      io.to(channel).emit(SOCKET_EVENTS.PLAYBACK_STATE, updatedState);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── PLAYBACK:SEEK ─────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.PLAYBACK_SEEK, async (data: unknown) => {
    try {
      const allowed = await SocketRateLimiter.checkRateLimit(socket.id, SOCKET_EVENTS.PLAYBACK_SEEK);
      if (!allowed) return;

      const parsed = socketSeekSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode, positionMs } = parsed.data;
      const canControl = await roomService.hasControl(roomCode, userId);
      if (!canControl) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.FORBIDDEN });
        return;
      }

      const currentState = await RedisPlaybackManager.getState(roomCode);
      const isPlaying = currentState?.isPlaying ?? false;

      if (isPlaying && currentState?.trackId) {
        // If actively playing, re-coordinate via ready barrier for clean resync
        const channel = getRoomChannel(roomCode);
        const sockets = await io.in(channel).fetchSockets();
        const connectedUserIds = sockets
          .map((s) => (s as any).data?.user?.id as string)
          .filter(Boolean);

        await RoomBarrierManager.startBarrier(
          io,
          roomCode,
          currentState.trackId,
          positionMs,
          connectedUserIds
        );
      } else {
        const updatedState = await RedisPlaybackManager.setState(roomCode, {
          trackId: currentState?.trackId,
          isPlaying: false,
          positionMs,
        });

        const channel = getRoomChannel(roomCode);
        io.to(channel).emit(SOCKET_EVENTS.PLAYBACK_STATE, updatedState);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── PLAYBACK:CHANGE_SONG (Barrier-coordinated start) ─────────────────────
  socket.on(SOCKET_EVENTS.PLAYBACK_CHANGE_SONG, async (data: unknown) => {
    try {
      const allowed = await SocketRateLimiter.checkRateLimit(socket.id, SOCKET_EVENTS.PLAYBACK_CHANGE_SONG);
      if (!allowed) return;

      const parsed = socketChangeSongSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode, trackId } = parsed.data;
      const canControl = await roomService.hasControl(roomCode, userId);
      if (!canControl) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: MESSAGES.FORBIDDEN });
        return;
      }

      // Resolve JioSaavn ID → MongoDB ID if needed, and persist the song
      let resolvedTrackId = trackId;
      if (!mongoose.isValidObjectId(trackId)) {
        const songService = container.resolve<ISongService>(TOKENS.SongService as symbol);
        const songDto = await songService.getById(trackId);
        resolvedTrackId = songDto.id;
      }

      const channel = getRoomChannel(roomCode);
      const sockets = await io.in(channel).fetchSockets();
      const connectedUserIds = sockets
        .map((s) => (s as any).data?.user?.id as string)
        .filter(Boolean);

      await RoomBarrierManager.startBarrier(io, roomCode, resolvedTrackId, 0, connectedUserIds);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── SYNC:READY (Member confirms cued and ready for playback) ─────────────
  socket.on(SOCKET_EVENTS.SYNC_READY, (data: any) => {
    if (!data?.roomCode || data?.version === undefined) return;
    RoomBarrierManager.handleMemberReady(io, data.roomCode, userId, Number(data.version));
  });

  // ─── BUFFERING:STATE (Member reports buffering start / end) ───────────────
  socket.on(SOCKET_EVENTS.BUFFERING_STATE, (data: any) => {
    if (!data?.roomCode) return;
    const username = (socket.data as any)?.user?.username || 'A listener';
    RoomBufferingManager.handleBufferingState(
      io,
      data.roomCode,
      userId,
      username,
      Boolean(data.isBuffering)
    );
  });

  // ─── PLAYBACK:EMBED_ERROR (YouTube embed restricted, auto-skip) ───────────
  socket.on(SOCKET_EVENTS.PLAYBACK_EMBED_ERROR, async (data: any) => {
    try {
      const { roomCode, trackId } = data || {};
      if (!roomCode) return;

      const channel = getRoomChannel(roomCode);
      const currentRoom = await roomService.getRoomByCode(roomCode, userId);

      if (currentRoom.queue && currentRoom.queue.length > 0) {
        const nextSong = currentRoom.queue[0];
        await roomService.removeFromQueue(roomCode, currentRoom.hostId, nextSong.songId);

        io.to(channel).emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: 'Video is restricted from embedding by YouTube. Auto-skipping to next song...',
        });

        const sockets = await io.in(channel).fetchSockets();
        const connectedUserIds = sockets
          .map((s) => (s as any).data?.user?.id as string)
          .filter(Boolean);

        await RoomBarrierManager.startBarrier(io, roomCode, nextSong.songId, 0, connectedUserIds);
      } else {
        await RedisPlaybackManager.setState(roomCode, { isPlaying: false, positionMs: 0 });
        io.to(channel).emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: 'This video cannot be embedded, and the queue is empty.',
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Error handling PLAYBACK_EMBED_ERROR');
    }
  });

  // ─── QUEUE:ADD ─────────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.QUEUE_ADD, async (data: unknown) => {
    try {
      const parsed = socketQueueAddSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode, songId } = parsed.data;
      const room = await roomService.addToQueue(roomCode, userId, songId);

      const channel = getRoomChannel(roomCode);
      io.to(channel).emit(SOCKET_EVENTS.QUEUE_UPDATED, { queue: room.queue });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── QUEUE:REMOVE ──────────────────────────────────────────────────────────
  socket.on(SOCKET_EVENTS.QUEUE_REMOVE, async (data: unknown) => {
    try {
      const parsed = socketQueueRemoveSchema.safeParse(data);
      if (!parsed.success) return;

      const { roomCode, songId } = parsed.data;
      const room = await roomService.removeFromQueue(roomCode, userId, songId);

      const channel = getRoomChannel(roomCode);
      io.to(channel).emit(SOCKET_EVENTS.QUEUE_UPDATED, { queue: room.queue });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : MESSAGES.INTERNAL_ERROR;
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message });
    }
  });

  // ─── Disconnect cleanup ───────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    if (currentJoinedRoomCode) {
      try {
        RoomBufferingManager.handleMemberLeave(io, currentJoinedRoomCode, userId);
      } catch (err) {
        logger.error({ err, userId }, 'Error in room disconnect cleanup');
      }
    }
  });
}
