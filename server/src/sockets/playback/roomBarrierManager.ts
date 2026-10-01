import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { SYNC_CONSTANTS } from '../../constants/sync.constants';
import { RedisPlaybackManager } from './playbackState';
import { logger } from '../../utils/logger';

interface BarrierState {
  version: number;
  trackId: string;
  positionMs: number;
  expectedMembers: Set<string>;
  readyMembers: Set<string>;
  timer: NodeJS.Timeout;
}

export class RoomBarrierManager {
  private static barriers = new Map<string, BarrierState>();

  /**
   * Initiates a ready barrier for a room.
   * Cues playback, broadcasts SYNC_LOAD, and waits for all members or timeout.
   */
  static async startBarrier(
    io: Server,
    roomCode: string,
    trackId: string,
    positionMs: number,
    connectedUserIds: string[]
  ): Promise<void> {
    const code = roomCode.toUpperCase();
    this.clearBarrier(code);

    // Save initial paused state with incremented version
    const updatedState = await RedisPlaybackManager.setState(code, {
      trackId,
      isPlaying: false,
      positionMs,
    });

    const expectedMembers = new Set(connectedUserIds);
    const readyMembers = new Set<string>();

    const timeoutTimer = setTimeout(() => {
      logger.info({ roomCode: code }, 'Barrier timed out, broadcasting start to available members');
      this.executeStart(io, code);
    }, SYNC_CONSTANTS.READY_BARRIER_TIMEOUT_MS);

    this.barriers.set(code, {
      version: updatedState.version,
      trackId,
      positionMs,
      expectedMembers,
      readyMembers,
      timer: timeoutTimer,
    });

    // Broadcast LOAD to all room members
    const channel = `room:${code}`;
    io.to(channel).emit(SOCKET_EVENTS.SYNC_LOAD, {
      roomCode: code,
      trackId,
      positionMs,
      version: updatedState.version,
    });

    // If room is empty or 0 members expected, start immediately
    if (expectedMembers.size === 0) {
      this.executeStart(io, code);
    }
  }

  /**
   * Called when a client finishes cueing and is ready.
   */
  static handleMemberReady(
    io: Server,
    roomCode: string,
    userId: string,
    version: number
  ): void {
    const code = roomCode.toUpperCase();
    const barrier = this.barriers.get(code);
    if (!barrier || barrier.version !== version) return;

    barrier.readyMembers.add(userId);

    // If all expected members are ready, release barrier immediately
    if (barrier.readyMembers.size >= barrier.expectedMembers.size) {
      logger.info({ roomCode: code }, 'All room members ready, releasing barrier early');
      this.executeStart(io, code);
    }
  }

  /**
   * Releases the barrier and schedules simultaneous playback start.
   */
  private static async executeStart(io: Server, roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase();
    const barrier = this.barriers.get(code);
    if (!barrier) return;

    clearTimeout(barrier.timer);
    this.barriers.delete(code);

    const scheduledAt = Date.now() + SYNC_CONSTANTS.START_LEAD_BUFFER_MS;

    const updatedState = await RedisPlaybackManager.setState(code, {
      trackId: barrier.trackId,
      isPlaying: true,
      positionMs: barrier.positionMs,
      scheduledAt,
    });

    const channel = `room:${code}`;
    io.to(channel).emit(SOCKET_EVENTS.SYNC_START, {
      trackId: barrier.trackId,
      positionMs: barrier.positionMs,
      scheduledAt,
      version: updatedState.version,
    });

    io.to(channel).emit(SOCKET_EVENTS.PLAYBACK_STATE, updatedState);
  }

  /**
   * Cleans up barrier on disconnect or manual stop.
   */
  static clearBarrier(roomCode: string): void {
    const code = roomCode.toUpperCase();
    const existing = this.barriers.get(code);
    if (existing) {
      clearTimeout(existing.timer);
      this.barriers.delete(code);
    }
  }
}
