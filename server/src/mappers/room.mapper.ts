import { IRoom, IRoomMember, IRoomQueueItem } from '../models/Room.model';
import { RoomDto, RoomMemberDto, RoomQueueItemDto } from '../dtos/room/room.dto';
import { toSongDto } from './song.mapper';
import { ISong } from '../models/Song.model';
import { IUser } from '../models/User.model';

export function toRoomMemberDto(member: IRoomMember): RoomMemberDto {
  const isPopulatedUser = member.userId && typeof member.userId === 'object' && 'username' in (member.userId as unknown as Record<string, unknown>);
  const user = isPopulatedUser ? (member.userId as unknown as IUser) : null;

  return {
    userId: isPopulatedUser ? user!._id.toString() : member.userId.toString(),
    username: user ? user.username : undefined,
    avatarUrl: user ? user.avatarUrl : undefined,
    socketId: member.socketId,
    hasControl: member.hasControl,
    joinedAt: member.joinedAt,
  };
}

export function toRoomQueueItemDto(item: IRoomQueueItem): RoomQueueItemDto {
  const isPopulatedSong = item.songId && typeof item.songId === 'object' && 'title' in (item.songId as unknown as Record<string, unknown>);
  const song = isPopulatedSong ? (item.songId as unknown as ISong) : null;

  return {
    songId: isPopulatedSong ? song!._id.toString() : item.songId.toString(),
    addedBy: item.addedBy.toString(),
    position: item.position,
    song: song ? toSongDto(song) : undefined,
  };
}

export function toRoomDto(room: IRoom): RoomDto {
  return {
    id: room._id.toString(),
    code: room.code,
    type: room.type,
    hostId: (room.hostId && typeof room.hostId === 'object' && '_id' in (room.hostId as unknown as Record<string, unknown>))
      ? (room.hostId as unknown as { _id: { toString(): string } })._id.toString()
      : room.hostId.toString(),
    members: (room.members || []).map(toRoomMemberDto),
    playbackState: {
      trackId: room.playbackState?.trackId,
      isPlaying: Boolean(room.playbackState?.isPlaying),
      positionMs: room.playbackState?.positionMs ?? 0,
      serverTimestamp: room.playbackState?.serverTimestamp ?? Date.now(),
      version: room.playbackState?.version ?? 0,
    },
    queue: (room.queue || []).map(toRoomQueueItemDto),
    isActive: room.isActive,
    createdAt: room.createdAt,
  };
}
