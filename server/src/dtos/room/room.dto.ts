import { SongDto } from '../song/song.dto';

export interface RoomMemberDto {
  userId: string;
  username?: string;
  avatarUrl?: string;
  socketId?: string;
  hasControl: boolean;
  joinedAt: Date;
}

export interface PlaybackStateDto {
  trackId?: string;
  isPlaying: boolean;
  positionMs: number;
  serverTimestamp: number;
  version: number;
  scheduledAt?: number;
}

export interface RoomQueueItemDto {
  songId: string;
  addedBy: string;
  position: number;
  song?: SongDto;
}

export interface RoomDto {
  id: string;
  code: string;
  type: 'couples' | 'party';
  hostId: string;
  members: RoomMemberDto[];
  playbackState: PlaybackStateDto;
  queue: RoomQueueItemDto[];
  isActive: boolean;
  createdAt: Date;
}
