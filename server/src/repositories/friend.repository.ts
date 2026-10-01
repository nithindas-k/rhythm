import { injectable } from 'tsyringe';
import { Friend, IFriend, FriendStatus } from '../models/Friend.model';
import { IFriendRepository } from './interfaces/IFriendRepository';

const USER_PROJECTION = 'username avatarUrl';

@injectable()
export class FriendRepository implements IFriendRepository {
  async findById(id: string): Promise<IFriend | null> {
    return Friend.findById(id)
      .populate('senderId', USER_PROJECTION)
      .populate('receiverId', USER_PROJECTION)
      .lean<IFriend>()
      .exec();
  }

  async findRelationship(userAId: string, userBId: string): Promise<IFriend | null> {
    return Friend.findOne({
      $or: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    })
      .lean<IFriend>()
      .exec();
  }

  async findBySenderAndReceiver(
    senderId: string,
    receiverId: string
  ): Promise<IFriend | null> {
    return Friend.findOne({ senderId, receiverId }).lean<IFriend>().exec();
  }

  async findAcceptedFriends(userId: string): Promise<IFriend[]> {
    return Friend.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: 'accepted',
    })
      .populate('senderId', USER_PROJECTION)
      .populate('receiverId', USER_PROJECTION)
      .sort({ updatedAt: -1 })
      .lean<IFriend[]>()
      .exec();
  }

  async findIncomingRequests(userId: string): Promise<IFriend[]> {
    return Friend.find({ receiverId: userId, status: 'pending' })
      .populate('senderId', USER_PROJECTION)
      .populate('receiverId', USER_PROJECTION)
      .sort({ createdAt: -1 })
      .lean<IFriend[]>()
      .exec();
  }

  async findOutgoingRequests(userId: string): Promise<IFriend[]> {
    return Friend.find({ senderId: userId, status: 'pending' })
      .populate('senderId', USER_PROJECTION)
      .populate('receiverId', USER_PROJECTION)
      .sort({ createdAt: -1 })
      .lean<IFriend[]>()
      .exec();
  }

  async create(senderId: string, receiverId: string): Promise<IFriend> {
    const friend = new Friend({ senderId, receiverId, status: 'pending' });
    const saved = await friend.save();
    const populated = await this.findById(saved._id.toString());
    return populated ?? (saved.toObject() as IFriend);
  }

  async updateStatus(id: string, status: FriendStatus): Promise<IFriend | null> {
    return Friend.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate('senderId', USER_PROJECTION)
      .populate('receiverId', USER_PROJECTION)
      .lean<IFriend>()
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    await Friend.findByIdAndDelete(id).exec();
  }
}
