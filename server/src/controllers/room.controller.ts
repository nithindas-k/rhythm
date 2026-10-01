import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IRoomController } from './interfaces/IRoomController';
import { IRoomService } from '../services/interfaces/IRoomService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import {
  CreateRoomDto,
  InviteMemberDto,
  TransferHostDto,
  MemberControlDto,
  AddToQueueDto,
} from '../validators/room.validator';
import { getIO } from '../sockets/index';
import { SOCKET_EVENTS } from '../constants/socketEvents';

@injectable()
export class RoomController implements IRoomController {
  constructor(
    @inject(TOKENS.RoomService) private roomService: IRoomService
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateRoomDto;
      const room = await this.roomService.createRoom(req.user!.id, dto);
      sendCreated(res, room, MESSAGES.ROOM.CREATED);
    } catch (err) {
      next(err);
    }
  }

  async getByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const room = await this.roomService.getRoomByCode(
        String(req.params['code']),
        req.user!.id
      );
      sendSuccess(res, room);
    } catch (err) {
      next(err);
    }
  }

  async transferHost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { newHostId } = req.body as TransferHostDto;
      const room = await this.roomService.transferHost(
        String(req.params['code']),
        req.user!.id,
        newHostId
      );
      sendSuccess(res, room, MESSAGES.ROOM.HOST_TRANSFERRED);
    } catch (err) {
      next(err);
    }
  }

  async endRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.roomService.endRoom(String(req.params['code']), req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async invite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body as InviteMemberDto;
      const code = String(req.params['code']);
      await this.roomService.inviteMember(code, req.user!.id, userId);

      // Real-time notification to the invited friend
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit(SOCKET_EVENTS.ROOM_INVITE, {
          roomCode: code,
          fromUserId: req.user!.id,
        });
      } catch {
        // Socket may not be initialized in test environments
      }

      sendSuccess(res, null, MESSAGES.ROOM.INVITE_SENT);
    } catch (err) {
      next(err);
    }
  }

  async updateControl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { hasControl } = req.body as MemberControlDto;
      const code = String(req.params['code']);
      const targetUserId = String(req.params['userId']);
      const updated = await this.roomService.updateMemberControl(
        code,
        req.user!.id,
        targetUserId,
        hasControl
      );

      // Broadcast socket event for real-time button enablement
      try {
        const io = getIO();
        const event = hasControl
          ? SOCKET_EVENTS.ROOM_CONTROL_GRANTED
          : SOCKET_EVENTS.ROOM_CONTROL_REVOKED;
        io.to(`room:${code.toUpperCase()}`).emit(event, { userId: targetUserId });
      } catch {
        // Continue if socket server not ready
      }

      sendSuccess(
        res,
        updated,
        hasControl ? MESSAGES.ROOM.CONTROL_GRANTED : MESSAGES.ROOM.CONTROL_REVOKED
      );
    } catch (err) {
      next(err);
    }
  }

  async addToQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { songId } = req.body as AddToQueueDto;
      const updated = await this.roomService.addToQueue(
        String(req.params['code']),
        req.user!.id,
        songId
      );
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async removeFromQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await this.roomService.removeFromQueue(
        String(req.params['code']),
        req.user!.id,
        String(req.params['songId'])
      );
      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }
}
