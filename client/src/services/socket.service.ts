import { io, Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { useAuthStore } from '../store/authStore';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;

  constructor() {
    this.serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  }

  connect(): Socket {
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(this.serverUrl, {
      auth: (cb) => {
        const currentToken = useAuthStore.getState().accessToken;
        cb({ token: currentToken || '' });
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected successfully:', this.socket?.id);
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, async (err) => {
      console.warn('Socket connection error:', err.message);
      if (
        err.message.includes('token') ||
        err.message.includes('expired') ||
        err.message.includes('auth') ||
        err.message.includes('Authentication')
      ) {
        try {
          await useAuthStore.getState().checkAuth();
          const refreshedToken = useAuthStore.getState().accessToken;
          if (this.socket && refreshedToken) {
            this.socket.auth = { token: refreshedToken };
            this.socket.connect();
          }
        } catch {
          // ignore
        }
      }
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  // Room Actions
  joinRoom(roomCode: string): void {
    const socket = this.getSocket();
    if (!socket) return;
    // Socket is always connected before this is called (connect() is invoked in RoomPage first).
    // Emit directly; if somehow not yet connected, queue via once('connect').
    if (socket.connected) {
      socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode });
    } else {
      socket.once('connect', () => socket.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode }));
    }
  }

  leaveRoom(roomCode: string): void {
    this.getSocket()?.emit(SOCKET_EVENTS.ROOM_LEAVE, { roomCode });
  }

  play(roomCode: string, trackId: string, positionMs: number): void {
    this.getSocket()?.emit(SOCKET_EVENTS.PLAYBACK_PLAY, {
      roomCode,
      trackId,
      positionMs: Math.floor(positionMs),
    });
  }

  pause(roomCode: string, positionMs: number): void {
    this.getSocket()?.emit(SOCKET_EVENTS.PLAYBACK_PAUSE, {
      roomCode,
      positionMs: Math.floor(positionMs),
    });
  }

  seek(roomCode: string, positionMs: number): void {
    this.getSocket()?.emit(SOCKET_EVENTS.PLAYBACK_SEEK, {
      roomCode,
      positionMs: Math.floor(positionMs),
    });
  }

  changeSong(roomCode: string, trackId: string): void {
    this.getSocket()?.emit(SOCKET_EVENTS.PLAYBACK_CHANGE_SONG, {
      roomCode,
      trackId,
    });
  }

  addToQueue(roomCode: string, songId: string): void {
    this.getSocket()?.emit(SOCKET_EVENTS.QUEUE_ADD, {
      roomCode,
      songId,
    });
  }

  removeFromQueue(roomCode: string, songId: string): void {
    this.getSocket()?.emit(SOCKET_EVENTS.QUEUE_REMOVE, {
      roomCode,
      songId,
    });
  }

  pingSync(clientTs: number = Date.now()): void {
    this.getSocket()?.emit(SOCKET_EVENTS.SYNC_PING, { clientTs });
  }

  emitReaction(roomCode: string, emoji: string): void {
    this.getSocket()?.emit('ROOM:REACTION', { roomCode, emoji });
  }
}

export const socketService = new SocketService();
