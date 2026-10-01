import { Request, Response, NextFunction } from 'express';

export interface IRoomController {
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  getByCode(req: Request, res: Response, next: NextFunction): Promise<void>;
  transferHost(req: Request, res: Response, next: NextFunction): Promise<void>;
  endRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
  invite(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateControl(req: Request, res: Response, next: NextFunction): Promise<void>;
  addToQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
  removeFromQueue(req: Request, res: Response, next: NextFunction): Promise<void>;
}
