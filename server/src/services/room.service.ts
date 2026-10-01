import { injectable, inject } from 'tsyringe';
import mongoose from 'mongoose';
import { IRoomService } from './interfaces/IRoomService';
import { IRoomRepository } from '../repositories/interfaces/IRoomRepository';
import { ISongRepository } from '../repositories/interfaces/ISongRepository';
import { ISongService } from './interfaces/ISongService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { TOKENS } from '../container/tokens';
import { RoomDto } from '../dtos/room/room.dto';
import { toRoomDto } from '../mappers/room.mapper';
import { CreateRoomDto } from '../validators/room.validator';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/index';
import { MESSAGES } from '../constants/messages';
import { ROOM_LIMITS } from '../constants/limits';
import { RedisPlaybackManager } from '../sockets/playback/playbackState';
import { IRoom, IRoomMember } from '../models/Room.model';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_LIMITS.CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

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
export class RoomService implements IRoomService {
  constructor(
    @inject(TOKENS.RoomRepository) private roomRepository: IRoomRepository,
    @inject(TOKENS.SongRepository) private songRepository: ISongRepository,
    @inject(TOKENS.SongService) private songService: ISongService,
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto): Promise<RoomDto> {
    let code = generateRoomCode();
    let existing = await this.roomRepository.findByCode(code);
    let attempts = 0;

    while (existing && attempts < 5) {
      code = generateRoomCode();
      existing = await this.roomRepository.findByCode(code);
      attempts++;
    }

    const hostMember: IRoomMember = {
      userId: new mongoose.Types.ObjectId(userId),
      hasControl: true,
      joinedAt: new Date(),
    };

    const room = await this.roomRepository.create({
      code,
      type: dto.type,
      hostId: new mongoose.Types.ObjectId(userId),
      members: [hostMember],
      queue: [],
      playbackState: {
        trackId: undefined,
        isPlaying: false,
        positionMs: 0,
        serverTimestamp: Date.now(),
        version: 0,
      },
      isActive: true,
    });

    // Initialize Redis state
    await RedisPlaybackManager.setState(code, {
      isPlaying: false,
      positionMs: 0,
    });

    return toRoomDto(room);
  }

  async getRoomByCode(code: string, _userId: string): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);

    // Merge authoritative Redis playback state if present
    const redisState = await RedisPlaybackManager.getState(code);
    if (redisState) {
      room.playbackState = {
        trackId: redisState.trackId,
        isPlaying: redisState.isPlaying,
        positionMs: redisState.positionMs,
        serverTimestamp: redisState.serverTimestamp,
        version: redisState.version,
      };
    }

    return toRoomDto(room);
  }

  async joinRoom(code: string, userId: string, socketId?: string): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);

    const isMember = room.members.some((m) => extractId(m.userId) === userId);

    if (!isMember) {
      if (room.type === 'couples' && room.members.length >= ROOM_LIMITS.COUPLES_MAX_MEMBERS) {
        throw new ConflictError(MESSAGES.ROOM.COUPLES_FULL);
      }
      if (room.type === 'party' && room.members.length >= ROOM_LIMITS.PARTY_MAX_MEMBERS) {
        throw new ConflictError('Party room has reached maximum capacity');
      }

      const isHost = extractId(room.hostId) === userId;

      const newMember: IRoomMember = {
        userId: new mongoose.Types.ObjectId(userId),
        socketId,
        hasControl: isHost,   // Host always gets control; guests default to false
        joinedAt: new Date(),
      };

      const updated = await this.roomRepository.addMember(room._id.toString(), newMember);
      return toRoomDto(updated ?? (await this.roomRepository.findByCode(code))!);
    }

    // Existing member reconnecting — update their socketId
    if (socketId) {
      await this.roomRepository.updateMemberSocket(room._id.toString(), userId, socketId);
    }

    // If the reconnecting member is the host, make sure hasControl is true
    // (guard against stale data from old rooms)
    const isHost = extractId(room.hostId) === userId;
    if (isHost) {
      await this.roomRepository.updateMemberControl(room._id.toString(), userId, true);
    }

    return this.getRoomByCode(code, userId);
  }

  async leaveRoom(code: string, userId: string): Promise<{ room: RoomDto | null; ended: boolean; newHostId?: string }> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) return { room: null, ended: false };

    const hostId = extractId(room.hostId);
    const isHost = hostId === userId;
    const remainingMembers = room.members.filter((m) => extractId(m.userId) !== userId);

    if (isHost) {
      if (remainingMembers.length === 0) {
        // When all members leave or host disconnects, DO NOT destroy the room.
        // Keep the room alive in MongoDB so the host or guests can reconnect.
        await this.roomRepository.removeMember(room._id.toString(), userId);
        return { room: null, ended: false };
      }

      // Transfer host to first remaining member
      const newHost = remainingMembers[0];
      const newHostId = extractId(newHost.userId);
      await this.roomRepository.removeMember(room._id.toString(), userId);
      await this.roomRepository.updateHost(room._id.toString(), newHostId);
      await this.roomRepository.updateMemberControl(room._id.toString(), newHostId, true);

      const updated = await this.roomRepository.findByCode(code);
      return { room: updated ? toRoomDto(updated) : null, ended: false, newHostId };
    }

    const updated = await this.roomRepository.removeMember(room._id.toString(), userId);
    return { room: updated ? toRoomDto(updated) : null, ended: false };
  }

  async transferHost(code: string, currentHostId: string, newHostId: string): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);
    if (extractId(room.hostId) !== currentHostId) throw new ForbiddenError(MESSAGES.ROOM.NOT_HOST);

    const isMember = room.members.some((m) => extractId(m.userId) === newHostId);
    if (!isMember) throw new NotFoundError(MESSAGES.ROOM.MEMBER_NOT_FOUND);

    await this.roomRepository.updateHost(room._id.toString(), newHostId);
    await this.roomRepository.updateMemberControl(room._id.toString(), newHostId, true);

    const updated = await this.roomRepository.findByCode(code);
    return toRoomDto(updated!);
  }

  async endRoom(code: string, hostId: string): Promise<void> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);
    if (extractId(room.hostId) !== hostId) throw new ForbiddenError(MESSAGES.ROOM.NOT_HOST);

    await this.roomRepository.deactivate(room._id.toString());
    await RedisPlaybackManager.deleteState(code);
  }

  async inviteMember(code: string, hostId: string, targetUserId: string): Promise<void> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);

    if (room.type === 'couples' && room.members.length >= ROOM_LIMITS.COUPLES_MAX_MEMBERS) {
      throw new ConflictError(MESSAGES.ROOM.COUPLES_FULL);
    }
  }

  async updateMemberControl(
    code: string,
    hostId: string,
    targetUserId: string,
    hasControl: boolean
  ): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);
    if (extractId(room.hostId) !== hostId) throw new ForbiddenError(MESSAGES.ROOM.NOT_HOST);

    const isMember = room.members.some((m) => extractId(m.userId) === targetUserId);
    if (!isMember) throw new NotFoundError(MESSAGES.ROOM.MEMBER_NOT_FOUND);

    const updated = await this.roomRepository.updateMemberControl(
      room._id.toString(),
      targetUserId,
      hasControl
    );
    return toRoomDto(updated!);
  }

  async addToQueue(code: string, userId: string, songId: string): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);

    // Resolve songId → MongoDB document.
    // If songId is a JioSaavn ID (not a MongoDB ObjectId), fetch & upsert via SongService.
    let resolvedSongId = songId;
    if (!mongoose.isValidObjectId(songId)) {
      const songDto = await this.songService.getById(songId);
      resolvedSongId = songDto.id;
    } else {
      const song = await this.songRepository.findById(songId);
      if (!song) throw new NotFoundError(MESSAGES.SONG.NOT_FOUND);
    }

    const position = room.queue.length;
    const updated = await this.roomRepository.addToQueue(room._id.toString(), {
      songId: new mongoose.Types.ObjectId(resolvedSongId),
      addedBy: new mongoose.Types.ObjectId(userId),
      position,
    });

    return toRoomDto(updated!);
  }

  async removeFromQueue(code: string, _userId: string, songId: string): Promise<RoomDto> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) throw new NotFoundError(MESSAGES.ROOM.NOT_FOUND);

    const updated = await this.roomRepository.removeFromQueue(room._id.toString(), songId);
    return toRoomDto(updated!);
  }

  async hasControl(code: string, userId: string): Promise<boolean> {
    const room = await this.roomRepository.findByCode(code);
    if (!room) return false;
    // Host always has control
    if (extractId(room.hostId) === userId) return true;
    // In a couples room, both members always have control
    if (room.type === 'couples') return true;
    // Party room: only members explicitly granted control
    const member = room.members.find((m) => extractId(m.userId) === userId);
    return Boolean(member?.hasControl);
  }
}
