import { FriendDto, FriendRequestDto } from '../../dtos/friend/friend.dto';

export interface IFriendService {
  sendRequest(senderId: string, receiverId: string): Promise<FriendRequestDto>;
  acceptRequest(requestId: string, currentUserId: string): Promise<FriendDto>;
  rejectRequest(requestId: string, currentUserId: string): Promise<void>;
  cancelRequest(requestId: string, currentUserId: string): Promise<void>;
  removeFriend(friendshipId: string, currentUserId: string): Promise<void>;
  getFriends(userId: string): Promise<FriendDto[]>;
  getIncomingRequests(userId: string): Promise<FriendRequestDto[]>;
  getOutgoingRequests(userId: string): Promise<FriendRequestDto[]>;
}
