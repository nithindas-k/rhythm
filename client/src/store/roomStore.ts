import { create } from 'zustand';
import type { Room, RoomMember, PlaybackState, RoomQueueItem } from '../types/room.types';
import type { Song } from '../types/song.types';

export interface ReactionItem {
  id: string;
  emoji: string;
  userId: string;
  username: string;
  timestamp: number;
}

interface RoomState {
  room: Room | null;
  playbackState: PlaybackState | null;
  currentSong: Song | null;
  members: RoomMember[];
  queue: RoomQueueItem[];
  clockOffsetMs: number;
  latencyMs: number;
  isConnected: boolean;
  isInRoom: boolean;
  isHost: boolean;
  canControl: boolean;
  reactions: ReactionItem[];
  waitingForMember: string | null;
  audioGateLocked: boolean;

  // Actions
  setRoom: (room: Room, currentUserId: string) => void;
  updatePlaybackState: (state: PlaybackState) => void;
  setCurrentSong: (song: Song | null) => void;
  setMembers: (members: RoomMember[], currentUserId: string) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  setHost: (newHostId: string, currentUserId: string) => void;
  setQueue: (queue: RoomQueueItem[]) => void;
  setClockOffset: (offset: number, latency: number) => void;
  setConnected: (connected: boolean) => void;
  setWaitingForMember: (username: string | null) => void;
  setAudioGateLocked: (locked: boolean) => void;
  addReaction: (emoji: string, userId: string, username: string) => void;
  resetRoom: () => void;
}

function dedupeMembers(members: RoomMember[] = []): RoomMember[] {
  const seen = new Set<string>();
  return members.filter((m) => {
    if (!m?.userId || seen.has(m.userId)) return false;
    seen.add(m.userId);
    return true;
  });
}

function computeCanControl(room: Room | null, currentUserId: string): boolean {
  if (!room) return false;
  if (room.hostId === currentUserId) return true;
  if (room.type === 'couples') return true;
  const currentMember = room.members?.find((m) => m.userId === currentUserId);
  return Boolean(currentMember?.hasControl);
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  playbackState: null,
  currentSong: null,
  members: [],
  queue: [],
  clockOffsetMs: 0,
  latencyMs: 0,
  isConnected: false,
  isInRoom: false,
  isHost: false,
  canControl: false,
  reactions: [],
  waitingForMember: null,
  audioGateLocked: false,

  setRoom: (room: Room, currentUserId: string) => {
    const isHost = room.hostId === currentUserId;
    const uniqueMembers = dedupeMembers(room.members);
    const canControl = computeCanControl({ ...room, members: uniqueMembers }, currentUserId);

    set({
      room: { ...room, members: uniqueMembers },
      playbackState: room.playbackState,
      members: uniqueMembers,
      queue: room.queue || [],
      isInRoom: true,
      isHost,
      canControl,
    });
  },

  updatePlaybackState: (state: PlaybackState) => {
    const current = get().playbackState;
    // Versioned server-authoritative state: ignore stale updates
    if (current?.version !== undefined && state.version !== undefined && state.version < current.version) {
      return;
    }
    set({ playbackState: state });
  },

  setCurrentSong: (song: Song | null) => {
    set({ currentSong: song });
  },

  setMembers: (members: RoomMember[], currentUserId: string) => {
    const { room } = get();
    const uniqueMembers = dedupeMembers(members);
    const canControl = room ? computeCanControl({ ...room, members: uniqueMembers }, currentUserId) : false;
    set({ members: uniqueMembers, canControl });
  },

  addMember: (member: RoomMember) => {
    const { members } = get();
    if (members.some((m) => m.userId === member.userId)) return;
    set({ members: [...members, member] });
  },

  removeMember: (userId: string) => {
    const { members } = get();
    set({ members: members.filter((m) => m.userId !== userId) });
  },

  setHost: (newHostId: string, currentUserId: string) => {
    const { room } = get();
    if (!room) return;
    const updatedRoom = { ...room, hostId: newHostId };
    set({
      room: updatedRoom,
      isHost: newHostId === currentUserId,
      canControl: computeCanControl(updatedRoom, currentUserId),
    });
  },

  setQueue: (queue: RoomQueueItem[]) => {
    set({ queue });
  },

  setClockOffset: (offset: number, latency: number) => {
    set({ clockOffsetMs: offset, latencyMs: latency });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setWaitingForMember: (username: string | null) => {
    set({ waitingForMember: username });
  },

  setAudioGateLocked: (locked: boolean) => {
    set({ audioGateLocked: locked });
  },

  addReaction: (emoji: string, userId: string, username: string) => {
    const newReaction: ReactionItem = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      userId,
      username,
      timestamp: Date.now(),
    };
    const current = get().reactions;
    // Keep max 15 active reactions
    set({ reactions: [...current.slice(-14), newReaction] });
  },

  resetRoom: () => {
    set({
      room: null,
      playbackState: null,
      currentSong: null,
      members: [],
      queue: [],
      isInRoom: false,
      isHost: false,
      canControl: false,
      reactions: [],
    });
  },
}));
