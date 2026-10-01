import { IRoom, IRoomMember, IRoomPlaybackState, IRoomQueueItem } from '../../models/Room.model';

export interface IRoomRepository {
  create(data: Partial<IRoom>): Promise<IRoom>;
  findByCode(code: string): Promise<IRoom | null>;
  findById(id: string): Promise<IRoom | null>;
  addMember(roomId: string, member: IRoomMember): Promise<IRoom | null>;
  removeMember(roomId: string, userId: string): Promise<IRoom | null>;
  updateMemberSocket(roomId: string, userId: string, socketId: string | undefined): Promise<void>;
  updateMemberControl(roomId: string, userId: string, hasControl: boolean): Promise<IRoom | null>;
  updateHost(roomId: string, newHostId: string): Promise<IRoom | null>;
  updatePlaybackState(roomId: string, state: IRoomPlaybackState): Promise<IRoom | null>;
  addToQueue(roomId: string, item: IRoomQueueItem): Promise<IRoom | null>;
  removeFromQueue(roomId: string, songId: string): Promise<IRoom | null>;
  setQueue(roomId: string, queue: IRoomQueueItem[]): Promise<IRoom | null>;
  deactivate(roomId: string): Promise<void>;
}
