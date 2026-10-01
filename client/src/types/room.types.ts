import type { Song } from './song.types';

export interface RoomMember {
  userId: string;
  username?: string;
  avatarUrl?: string;
  socketId?: string;
  hasControl: boolean;
  joinedAt: string;
}

export interface PlaybackState {
  trackId?: string;
  isPlaying: boolean;
  positionMs: number;
  serverTimestamp: number;
  version: number;
  scheduledAt?: number;
}

export interface RoomQueueItem {
  songId: string;
  addedBy: string;
  position: number;
  song?: Song;
}

export interface Room {
  id: string;
  code: string;
  type: 'couples' | 'party';
  hostId: string;
  members: RoomMember[];
  playbackState: PlaybackState;
  queue: RoomQueueItem[];
  isActive: boolean;
  createdAt: string;
}
