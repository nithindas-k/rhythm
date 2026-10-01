import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { SYNC_CONSTANTS } from '../../constants/sync.constants';
import { RedisPlaybackManager } from './playbackState';
import { logger } from '../../utils/logger';

interface BufferingMember {
  userId: string;
  username: string;
  bufferTimer?: NodeJS.Timeout;
}

interface RoomBufferingState {
  bufferingMembers: Map<string, BufferingMember>;
  isRoomPausedForBuffering: boolean;
  pausedPositionMs: number;
}

export class RoomBufferingManager {
  private static rooms = new Map<string, RoomBufferingState>();

  /**
   * Handles member buffering state changes.
   */
  static async handleBufferingState(
    io: Server,
    roomCode: string,
    userId: string,
    username: string,
    isBuffering: boolean
  ): Promise<void> {
    const code = roomCode.toUpperCase();
    let room = this.rooms.get(code);
    if (!room) {
      room = {
        bufferingMembers: new Map(),
        isRoomPausedForBuffering: false,
        pausedPositionMs: 0,
      };
      this.rooms.set(code, room);
    }

    const channel = `room:${code}`;

    if (isBuffering) {
      if (room.bufferingMembers.has(userId)) return;

      const memberInfo: BufferingMember = { userId, username };

      // Start 3-second timer
      memberInfo.bufferTimer = setTimeout(async () => {
        logger.warn({ roomCode: code, username }, 'Member buffering exceeded 3s, pausing room');
        
        // Fetch current playback state and pause
        const currentState = await RedisPlaybackManager.getState(code);
        if (currentState?.isPlaying) {
          room!.isRoomPausedForBuffering = true;
          room!.pausedPositionMs = currentState.positionMs;

          const updatedState = await RedisPlaybackManager.setState(code, {
            trackId: currentState.trackId,
            isPlaying: false,
            positionMs: currentState.positionMs,
          });

          io.to(channel).emit(SOCKET_EVENTS.ROOM_WAITING_FOR_MEMBER, {
            memberId: userId,
            username,
            isWaiting: true,
          });

          io.to(channel).emit(SOCKET_EVENTS.PLAYBACK_STATE, updatedState);
        }
      }, SYNC_CONSTANTS.BUFFERING_PAUSE_THRESHOLD_MS);

      room.bufferingMembers.set(userId, memberInfo);
    } else {
      // Stopped buffering
      const member = room.bufferingMembers.get(userId);
      if (member?.bufferTimer) {
        clearTimeout(member.bufferTimer);
      }
      room.bufferingMembers.delete(userId);

      // Check if anyone else in the room is still buffering
      if (room.bufferingMembers.size === 0 && room.isRoomPausedForBuffering) {
        room.isRoomPausedForBuffering = false;
        logger.info({ roomCode: code }, 'All members finished buffering, resuming playback');

        io.to(channel).emit(SOCKET_EVENTS.ROOM_WAITING_FOR_MEMBER, {
          isWaiting: false,
        });

        // Resume with scheduled start
        const scheduledAt = Date.now() + SYNC_CONSTANTS.START_LEAD_BUFFER_MS;
        const currentState = await RedisPlaybackManager.getState(code);

        const updatedState = await RedisPlaybackManager.setState(code, {
          trackId: currentState?.trackId,
          isPlaying: true,
          positionMs: room.pausedPositionMs || (currentState?.positionMs ?? 0),
          scheduledAt,
        });

        io.to(channel).emit(SOCKET_EVENTS.SYNC_START, {
          trackId: currentState?.trackId,
          positionMs: updatedState.positionMs,
          scheduledAt,
          version: updatedState.version,
        });

        io.to(channel).emit(SOCKET_EVENTS.PLAYBACK_STATE, updatedState);
      }
    }
  }

  /**
   * Remove member from buffering tracking when they leave or disconnect.
   */
  static handleMemberLeave(io: Server, roomCode: string, userId: string): void {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return;

    const member = room.bufferingMembers.get(userId);
    if (member?.bufferTimer) {
      clearTimeout(member.bufferTimer);
    }
    room.bufferingMembers.delete(userId);

    // If room was paused waiting for this specific member, check if others are still buffering
    if (room.bufferingMembers.size === 0 && room.isRoomPausedForBuffering) {
      this.handleBufferingState(io, code, userId, '', false);
    }
  }

  /**
   * Clean up room buffering state on room end.
   */
  static clearRoom(roomCode: string): void {
    const code = roomCode.toUpperCase();
    const room = this.rooms.get(code);
    if (room) {
      room.bufferingMembers.forEach((m) => {
        if (m.bufferTimer) clearTimeout(m.bufferTimer);
      });
      this.rooms.delete(code);
    }
  }
}
