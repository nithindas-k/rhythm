import { Request, Response, NextFunction } from 'express';

export interface IFriendController {
  getFriends(req: Request, res: Response, next: NextFunction): Promise<void>;
  getIncomingRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
  getOutgoingRequests(req: Request, res: Response, next: NextFunction): Promise<void>;
  searchUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
  sendRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
  acceptRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
  rejectRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
  cancelRequest(req: Request, res: Response, next: NextFunction): Promise<void>;
  removeFriend(req: Request, res: Response, next: NextFunction): Promise<void>;
}
