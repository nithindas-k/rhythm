import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IFriendService } from '../services/interfaces/IFriendService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendNoContent, sendCreated } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import { SendFriendRequestDto, FriendSearchDto } from '../validators/friend.validator';
import { IUserService } from '../services/interfaces/IUserService';

import { IFriendController } from './interfaces/IFriendController';

@injectable()
export class FriendController implements IFriendController {
  constructor(
    @inject(TOKENS.FriendService) private friendService: IFriendService,
    @inject(TOKENS.UserService) private userService: IUserService
  ) {}

  async getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const friends = await this.friendService.getFriends(req.user!.id);
      sendSuccess(res, friends);
    } catch (err) { next(err); }
  }

  async getIncomingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await this.friendService.getIncomingRequests(req.user!.id);
      sendSuccess(res, requests);
    } catch (err) { next(err); }
  }

  async getOutgoingRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await this.friendService.getOutgoingRequests(req.user!.id);
      sendSuccess(res, requests);
    } catch (err) { next(err); }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = String(req.query['q'] ?? '');
      const limit = Number(req.query['limit'] ?? 10);
      const users = await this.userService.searchUsers(q, limit, req.user!.id);
      sendSuccess(res, users);
    } catch (err) { next(err); }
  }

  async sendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.body as SendFriendRequestDto;
      const request = await this.friendService.sendRequest(req.user!.id, userId);
      sendCreated(res, request, MESSAGES.FRIEND.REQUEST_SENT);
    } catch (err) { next(err); }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const friend = await this.friendService.acceptRequest(String(req.params['id']), req.user!.id);
      sendSuccess(res, friend, MESSAGES.FRIEND.REQUEST_ACCEPTED);
    } catch (err) { next(err); }
  }

  async rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.friendService.rejectRequest(String(req.params['id']), req.user!.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  }

  async cancelRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.friendService.cancelRequest(String(req.params['id']), req.user!.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  }

  async removeFriend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.friendService.removeFriend(String(req.params['id']), req.user!.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  }
}
