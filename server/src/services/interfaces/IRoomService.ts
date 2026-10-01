import { RoomDto } from '../../dtos/room/room.dto';
import { CreateRoomDto } from '../../validators/room.validator';

export interface IRoomService {
  createRoom(userId: string, dto: CreateRoomDto): Promise<RoomDto>;
  getRoomByCode(code: string, userId: string): Promise<RoomDto>;
  transferHost(code: string, currentHostId: string, newHostId: string): Promise<RoomDto>;
  endRoom(code: string, hostId: string): Promise<void>;
  inviteMember(code: string, hostId: string, targetUserId: string): Promise<void>;
  updateMemberControl(code: string, hostId: string, targetUserId: string, hasControl: boolean): Promise<RoomDto>;
  addToQueue(code: string, userId: string, songId: string): Promise<RoomDto>;
  removeFromQueue(code: string, userId: string, songId: string): Promise<RoomDto>;
  joinRoom(code: string, userId: string, socketId?: string): Promise<RoomDto>;
  leaveRoom(code: string, userId: string): Promise<{ room: RoomDto | null; ended: boolean; newHostId?: string }>;
  hasControl(code: string, userId: string): Promise<boolean>;
}
