import { IFriend } from '../models/Friend.model';
import { IUser } from '../models/User.model';
import { FriendRequestDto, FriendDto } from '../dtos/friend/friend.dto';

type PopulatedUser = Pick<IUser, '_id' | 'username' | 'avatarUrl'>;

interface PopulatedFriend extends Omit<IFriend, 'senderId' | 'receiverId'> {
  senderId: PopulatedUser;
  receiverId: PopulatedUser;
}

function toMiniUser(user: PopulatedUser | Record<string, unknown> | unknown) {
  if (!user) return { id: '', username: '', avatarUrl: null };
  if (typeof user === 'object' && '_id' in (user as Record<string, unknown>)) {
    const u = user as PopulatedUser;
    return {
      id: u._id.toString(),
      username: u.username ?? '',
      avatarUrl: u.avatarUrl ?? null,
    };
  }
  return {
    id: String(user),
    username: '',
    avatarUrl: null,
  };
}

export function toFriendRequestDto(friend: PopulatedFriend): FriendRequestDto {
  return {
    id: friend._id.toString(),
    sender: toMiniUser(friend.senderId),
    receiver: toMiniUser(friend.receiverId),
    status: friend.status,
    createdAt: friend.createdAt,
  };
}

export function toFriendDto(friend: PopulatedFriend, currentUserId: string): FriendDto {
  // The "friend" is whichever side isn't the current user
  const senderId =
    typeof friend.senderId === 'object' && friend.senderId && '_id' in (friend.senderId as Record<string, unknown>)
      ? (friend.senderId as PopulatedUser)._id.toString()
      : String(friend.senderId);

  const isSender = senderId === currentUserId;
  const friendUser = isSender ? friend.receiverId : friend.senderId;

  return {
    id: friend._id.toString(),
    user: toMiniUser(friendUser),
    since: friend.updatedAt,
  };
}
