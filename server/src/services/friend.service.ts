import { injectable, inject } from 'tsyringe';
import { IFriendService } from './interfaces/IFriendService';
import { IFriendRepository } from '../repositories/interfaces/IFriendRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { TOKENS } from '../container/tokens';
import { getRedisClient } from '../config/redis';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { TTL } from '../constants/limits';
import { FriendDto, FriendRequestDto } from '../dtos/friend/friend.dto';
import { toFriendDto, toFriendRequestDto } from '../mappers/friend.mapper';
import { IFriend } from '../models/Friend.model';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../errors/index';
import { MESSAGES } from '../constants/messages';

function extractId(entityOrId: unknown): string {
  if (!entityOrId) return '';
  if (typeof entityOrId === 'string') return entityOrId;
  if (typeof entityOrId === 'object') {
    if ('_id' in (entityOrId as Record<string, unknown>)) {
      return String((entityOrId as Record<string, unknown>)._id);
    }
    if ('id' in (entityOrId as Record<string, unknown>)) {
      return String((entityOrId as Record<string, unknown>).id);
    }
  }
  return String(entityOrId);
}

@injectable()
export class FriendService implements IFriendService {
  constructor(
    @inject(TOKENS.FriendRepository) private friendRepository: IFriendRepository,
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

  // ── Send friend request ────────────────────────────────────────────────────

  async sendRequest(senderId: string, receiverId: string): Promise<FriendRequestDto> {
    if (senderId === receiverId) {
      throw new ConflictError(MESSAGES.FRIEND.CANNOT_ADD_SELF);
    }

    const receiver = await this.userRepository.findById(receiverId);
    if (!receiver) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);

    const existing = await this.friendRepository.findRelationship(senderId, receiverId);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new ConflictError(MESSAGES.FRIEND.ALREADY_FRIENDS);
      }
      throw new ConflictError(MESSAGES.FRIEND.REQUEST_ALREADY_SENT);
    }

    const request = await this.friendRepository.create(senderId, receiverId);
    return toFriendRequestDto(request as unknown as Parameters<typeof toFriendRequestDto>[0]);
  }


  // ── Accept request ─────────────────────────────────────────────────────────

  async acceptRequest(requestId: string, currentUserId: string): Promise<FriendDto> {
    const request = await this.friendRepository.findById(requestId);
    if (!request) throw new NotFoundError(MESSAGES.FRIEND.NOT_FOUND);

    const receiverId = extractId(request.receiverId);
    const senderId = extractId(request.senderId);

    if (receiverId !== currentUserId) {
      throw new ForbiddenError();
    }

    const updated = await this.friendRepository.updateStatus(requestId, 'accepted');
    await this.invalidateFriendCache(senderId, receiverId);

    return toFriendDto(
      updated as unknown as Parameters<typeof toFriendDto>[0],
      currentUserId
    );
  }

  // ── Reject request ─────────────────────────────────────────────────────────

  async rejectRequest(requestId: string, currentUserId: string): Promise<void> {
    const request = await this.friendRepository.findById(requestId);
    if (!request) throw new NotFoundError(MESSAGES.FRIEND.NOT_FOUND);

    const receiverId = extractId(request.receiverId);
    const senderId = extractId(request.senderId);

    if (receiverId !== currentUserId) {
      throw new ForbiddenError();
    }

    await this.friendRepository.updateStatus(requestId, 'rejected');
    await this.invalidateFriendCache(senderId, receiverId);
  }

  // ── Cancel sent request ────────────────────────────────────────────────────

  async cancelRequest(requestId: string, currentUserId: string): Promise<void> {
    const request = await this.friendRepository.findById(requestId);
    if (!request) throw new NotFoundError(MESSAGES.FRIEND.NOT_FOUND);

    const senderId = extractId(request.senderId);
    const receiverId = extractId(request.receiverId);

    if (senderId !== currentUserId) {
      throw new ForbiddenError();
    }

    await this.friendRepository.deleteById(requestId);
    await this.invalidateFriendCache(senderId, receiverId);
  }

  // ── Remove friend ──────────────────────────────────────────────────────────

  async removeFriend(friendshipId: string, currentUserId: string): Promise<void> {
    const friendship = await this.friendRepository.findById(friendshipId);
    if (!friendship || friendship.status !== 'accepted') {
      throw new NotFoundError(MESSAGES.FRIEND.NOT_FOUND);
    }

    const senderId = extractId(friendship.senderId);
    const receiverId = extractId(friendship.receiverId);

    const isMember = senderId === currentUserId || receiverId === currentUserId;

    if (!isMember) throw new ForbiddenError();

    await this.friendRepository.deleteById(friendshipId);
    await this.invalidateFriendCache(senderId, receiverId);
  }

  // ── List friends (Redis cached) ────────────────────────────────────────────

  async getFriends(userId: string): Promise<FriendDto[]> {
    const redis = getRedisClient();
    const cacheKey = CACHE_KEYS.FRIEND_LIST(userId);
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached) as FriendDto[];
    }

    const friends = await this.friendRepository.findAcceptedFriends(userId);
    const dtos = friends.map((f) =>
      toFriendDto(f as unknown as Parameters<typeof toFriendDto>[0], userId)
    );

    await redis.setex(cacheKey, TTL.FRIEND_LIST, JSON.stringify(dtos));
    return dtos;
  }

  // ── List incoming requests (Redis cached) ──────────────────────────────────

  async getIncomingRequests(userId: string): Promise<FriendRequestDto[]> {
    const redis = getRedisClient();
    const cacheKey = CACHE_KEYS.FRIEND_REQUESTS(userId);
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached) as FriendRequestDto[];

    const requests = await this.friendRepository.findIncomingRequests(userId);
    const dtos = requests.map((r) =>
      toFriendRequestDto(r as unknown as Parameters<typeof toFriendRequestDto>[0])
    );

    await redis.setex(cacheKey, TTL.FRIEND_REQUESTS, JSON.stringify(dtos));
    return dtos;
  }

  // ── List outgoing requests ─────────────────────────────────────────────────

  async getOutgoingRequests(userId: string): Promise<FriendRequestDto[]> {
    const requests = await this.friendRepository.findOutgoingRequests(userId);
    return requests.map((r) =>
      toFriendRequestDto(r as unknown as Parameters<typeof toFriendRequestDto>[0])
    );
  }

  // ── Cache invalidation ─────────────────────────────────────────────────────

  private async invalidateFriendCache(...userIds: string[]): Promise<void> {
    const redis = getRedisClient();
    const keys = userIds.flatMap((id) => [
      CACHE_KEYS.FRIEND_LIST(id),
      CACHE_KEYS.FRIEND_REQUESTS(id),
    ]);
    if (keys.length) await redis.del(...keys);
  }
}
