import { IFriend, FriendStatus } from '../../models/Friend.model';

export interface IFriendRepository {
  findById(id: string): Promise<IFriend | null>;
  /** Find a relationship between two users regardless of direction */
  findRelationship(userAId: string, userBId: string): Promise<IFriend | null>;
  /** Find a specific directional relationship */
  findBySenderAndReceiver(senderId: string, receiverId: string): Promise<IFriend | null>;
  /** List accepted friends of a user (populated) */
  findAcceptedFriends(userId: string): Promise<IFriend[]>;
  /** List pending incoming requests for a user (populated) */
  findIncomingRequests(userId: string): Promise<IFriend[]>;
  /** List pending outgoing requests from a user (populated) */
  findOutgoingRequests(userId: string): Promise<IFriend[]>;
  create(senderId: string, receiverId: string): Promise<IFriend>;
  updateStatus(id: string, status: FriendStatus): Promise<IFriend | null>;
  deleteById(id: string): Promise<void>;
}
