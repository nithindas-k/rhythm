import { injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Room, IRoom, IRoomMember, IRoomPlaybackState, IRoomQueueItem } from '../models/Room.model';
import { IRoomRepository } from './interfaces/IRoomRepository';

const USER_POPULATION = {
  path: 'members.userId',
  select: 'username avatarUrl',
};

const QUEUE_POPULATION = {
  path: 'queue.songId',
};

@injectable()
export class RoomRepository implements IRoomRepository {
  async create(data: Partial<IRoom>): Promise<IRoom> {
    const room = new Room(data);
    await room.save();
    const populated = await this.findByCode(room.code);
    return populated ?? (room.toObject() as IRoom);
  }

  async findByCode(code: string): Promise<IRoom | null> {
    return Room.findOne({ code: code.toUpperCase(), isActive: true })
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async findById(id: string): Promise<IRoom | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    return Room.findById(id)
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async addMember(roomId: string, member: IRoomMember): Promise<IRoom | null> {
    const updated = await Room.findOneAndUpdate(
      {
        _id: roomId,
        'members.userId': { $ne: member.userId },
      },
      { $push: { members: member } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();

    if (!updated) {
      return this.findById(roomId);
    }
    return updated;
  }

  async removeMember(roomId: string, userId: string): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      { $pull: { members: { userId: new mongoose.Types.ObjectId(userId) } } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async updateMemberSocket(roomId: string, userId: string, socketId: string | undefined): Promise<void> {
    await Room.updateOne(
      { _id: roomId, 'members.userId': new mongoose.Types.ObjectId(userId) },
      { $set: { 'members.$.socketId': socketId } }
    ).exec();
  }

  async updateMemberControl(roomId: string, userId: string, hasControl: boolean): Promise<IRoom | null> {
    return Room.findOneAndUpdate(
      { _id: roomId, 'members.userId': new mongoose.Types.ObjectId(userId) },
      { $set: { 'members.$.hasControl': hasControl } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async updateHost(roomId: string, newHostId: string): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      {
        $set: { hostId: new mongoose.Types.ObjectId(newHostId) },
      },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async updatePlaybackState(roomId: string, state: IRoomPlaybackState): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      { $set: { playbackState: state } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async addToQueue(roomId: string, item: IRoomQueueItem): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      { $push: { queue: item } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async removeFromQueue(roomId: string, songId: string): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      { $pull: { queue: { songId: new mongoose.Types.ObjectId(songId) } } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async setQueue(roomId: string, queue: IRoomQueueItem[]): Promise<IRoom | null> {
    return Room.findByIdAndUpdate(
      roomId,
      { $set: { queue } },
      { new: true }
    )
      .populate(USER_POPULATION)
      .populate(QUEUE_POPULATION)
      .lean<IRoom>()
      .exec();
  }

  async deactivate(roomId: string): Promise<void> {
    await Room.findByIdAndUpdate(roomId, { $set: { isActive: false } }).exec();
  }
}
